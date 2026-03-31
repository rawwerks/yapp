import { describe, expect, it } from "vitest";
import {
	DEFAULT_EXACT_COMMAND_PATTERNS,
	looksLikeJson,
	shouldPreserveExactOutput,
	stripBuiltinNotice,
} from "../src/index.js";

const defaultMatchers = DEFAULT_EXACT_COMMAND_PATTERNS.map((pattern) => new RegExp(pattern));

describe("looksLikeJson", () => {
	it("detects JSON objects and arrays", () => {
		expect(looksLikeJson('{"ok":true}')).toBe(true);
		expect(looksLikeJson('[{"id":1},{"id":2}]')).toBe(true);
	});

	it("ignores plain text and truncated JSON", () => {
		expect(looksLikeJson("Title: result\nURL: https://example.com")).toBe(false);
		expect(looksLikeJson('{"ok":true')).toBe(false);
	});
});

describe("shouldPreserveExactOutput", () => {
	it("preserves exa commands by default", () => {
		expect(shouldPreserveExactOutput('exa web-search-exa --query "pi"', "search results", defaultMatchers, true)).toBe(
			true,
		);
	});

	it("preserves raw/json flag commands by default", () => {
		expect(shouldPreserveExactOutput("tool --output raw", "payload", defaultMatchers, true)).toBe(true);
		expect(shouldPreserveExactOutput("tool --json", "payload", defaultMatchers, true)).toBe(true);
	});

	it("preserves valid JSON output when enabled", () => {
		expect(shouldPreserveExactOutput(undefined, '{"requestId":"abc","results":[]}', defaultMatchers, true)).toBe(true);
	});

	it("does not preserve valid JSON output when heuristic is disabled", () => {
		expect(shouldPreserveExactOutput(undefined, '{"requestId":"abc","results":[]}', defaultMatchers, false)).toBe(
			false,
		);
	});

	it("checks JSON after stripping pi's built-in truncation notice", () => {
		const parsed = stripBuiltinNotice(
			'{"requestId":"abc","results":[]}\n\n[Showing lines 1-100 of 100 (50KB limit). Full output: /tmp/exa.log]',
		);
		expect(shouldPreserveExactOutput(undefined, parsed.output, defaultMatchers, true)).toBe(true);
	});

	it("allows normal trimming for ordinary text output", () => {
		expect(
			shouldPreserveExactOutput("python3 - <<'PY'\nprint('hello')\nPY", "hello\nworld", defaultMatchers, true),
		).toBe(false);
	});
});
