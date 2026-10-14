import { describe, expect, it } from "vitest";
import { DIRECT_CLIENT, UNKNOWN_CLIENT, deriveClientKey, getClientIp, parseIp, rateLimitSubject } from "./client-ip";

const xff = (value: string) => new Headers({ "x-forwarded-for": value });
const trusted = { trustProxy: true, header: "x-forwarded-for" };

describe("getClientIp", () => {
  it("sem TRUST_PROXY ignora cabeçalhos (todos compartilham a chave)", () => {
    expect(getClientIp(xff("203.0.113.5"), { trustProxy: false, header: "x-forwarded-for" })).toBe(DIRECT_CLIENT);
  });

  it("com TRUST_PROXY usa o valor mais à direita (acrescentado pelo proxy confiável)", () => {
    // O cliente forja "6.6.6.6"; o proxy (nginx, ALB, Cloudflare) acrescenta o IP real.
    expect(getClientIp(xff("6.6.6.6, 203.0.113.5"), trusted)).toBe("203.0.113.5");
    expect(getClientIp(xff("203.0.113.5"), trusted)).toBe("203.0.113.5");
  });

  it("valores forjados à esquerda não mudam a chave (sem fuga do limite)", () => {
    const keys = new Set(
      ["1.1.1.1", "2.2.2.2", "garbage", "2001:db8::1"].map((spoof) =>
        getClientIp(xff(`${spoof}, 203.0.113.5`), trusted),
      ),
    );
    expect([...keys]).toEqual(["203.0.113.5"]);
  });

  it("hops conta os proxies confiáveis a partir da direita", () => {
    const chain = xff("6.6.6.6, 203.0.113.5, 10.0.0.1");
    expect(getClientIp(chain, { ...trusted, hops: 2 })).toBe("203.0.113.5");
    expect(getClientIp(chain, { ...trusted, hops: 1 })).toBe("10.0.0.1");
    // Menos valores do que proxies: a lista não veio dos proxies esperados.
    expect(getClientIp(chain, { ...trusted, hops: 4 })).toBe(UNKNOWN_CLIENT);
  });

  it("usa o cabeçalho configurado", () => {
    const headers = new Headers({ "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "203.0.113.5" });
    expect(getClientIp(headers, { trustProxy: true, header: "cf-connecting-ip" })).toBe("198.51.100.4");
  });

  it("cabeçalho ausente vira chave desconhecida", () => {
    expect(getClientIp(new Headers(), trusted)).toBe(UNKNOWN_CLIENT);
  });

  it.each(["<script>alert(1)</script>", "999.1.1.1", "1.2.3", "localhost", "", "1.2.3.4, ", "a".repeat(100), "1.2.3.4.5"])(
    "valor forjado ou inválido (%s) vira chave desconhecida",
    (value) => {
      expect(getClientIp(xff(value), trusted)).toBe(UNKNOWN_CLIENT);
    },
  );
});

describe("parseIp", () => {
  it.each([
    ["203.0.113.5", "203.0.113.5"],
    [" 203.0.113.5 ", "203.0.113.5"],
    ["203.0.113.5:8080", "203.0.113.5"],
    ["2001:DB8::1", "2001:db8::1"],
    ["[2001:db8::1]:443", "2001:db8::1"],
    ["[2001:db8::1]", "2001:db8::1"],
    ["fe80::1%eth0", "fe80::1"],
    ["::ffff:198.51.100.7", "198.51.100.7"],
  ])("%s -> %s", (input, expected) => {
    expect(parseIp(input)).toBe(expected);
  });

  it("recusa lixo", () => {
    expect(parseIp("2001:db8::1::2")).toBeNull();
    expect(parseIp("[1.2.3.4")).toBeNull();
    expect(parseIp("1.2.3.4:abc")).toBeNull();
  });
});

describe("rateLimitSubject", () => {
  it("agrupa IPv6 pelo prefixo /64", () => {
    expect(rateLimitSubject("2001:db8:1:2:3:4:5:6")).toBe("2001:0db8:0001:0002::/64");
    expect(rateLimitSubject("2001:db8:1:2::ffff")).toBe("2001:0db8:0001:0002::/64");
    expect(rateLimitSubject("2001:db8:1:3::1")).not.toBe(rateLimitSubject("2001:db8:1:2::1"));
    expect(rateLimitSubject("::1")).toBe("0000:0000:0000:0000::/64");
    expect(rateLimitSubject("64:ff9b::198.51.100.7")).toBe("0064:ff9b:0000:0000::/64");
  });

  it("mantém IPv4 e chaves especiais", () => {
    expect(rateLimitSubject("203.0.113.5")).toBe("203.0.113.5");
    expect(rateLimitSubject(DIRECT_CLIENT)).toBe(DIRECT_CLIENT);
  });
});

describe("deriveClientKey", () => {
  it("é determinística, depende do sal e não contém o IP", () => {
    const key = deriveClientKey("203.0.113.5", "sal-a");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(key).toBe(deriveClientKey("203.0.113.5", "sal-a"));
    expect(key).not.toBe(deriveClientKey("203.0.113.5", "sal-b"));
    expect(key).not.toBe(deriveClientKey("203.0.113.6", "sal-a"));
    expect(key).not.toContain("203");
  });

  it("endereços do mesmo /64 geram a mesma chave", () => {
    expect(deriveClientKey("2001:db8:1:2::a", "s")).toBe(deriveClientKey("2001:db8:1:2::b", "s"));
  });
});
