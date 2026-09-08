// @inlang/sdk fresh-project import workaround (lix issue #422).
//
// The compiler writes a brand-new inlang project in ONE giant transaction.
// With 500+ entities (4-locale message files) the single COMMIT fails with
//   tracked_state replacement native commit-delta projection certification
//   failed: Invalid("native field count differs between rows")
// while every INSERT individually succeeds. There is no released fix
// (@lix-js/sdk@0.15.1 is the newest on npm), so this re-assembles
// dist/import-export/importFiles.js to split the fresh import into
// chunked transactions (COMMIT_CHUNK_SIZE = 150) on a fast path that
// returns before the legacy single-transaction block runs.
//
// It is idempotent: on an already-patched install it is a no-op. On a
// vanilla `npm ci` it re-applies the patch before `astro build`. If the
// installed @inlang/sdk changes shape such that the markers no longer
// match, it fails loudly instead of corrupting the file.
//
// Run manually:   node scripts/apply-lix-patch.cjs
const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  'node_modules', '@inlang', 'sdk', 'dist', 'import-export', 'importFiles.js'
);
const CHUNK_MARK = 'COMMIT_CHUNK_SIZE = 150';
const START_MARK = '    await args.db.transaction().execute(async (trx) => {\n';
const END_MARK = '    });\n}\n//# sourceMappingURL=importFiles.js.map';

function main() {
  const abs = path.resolve(TARGET);
  if (!fs.existsSync(abs)) {
    throw new Error(`apply-lix-patch: ${abs} not found — run from the repo root after npm ci`);
  }
  const original = fs.readFileSync(abs, 'utf8');

  if (original.includes(CHUNK_MARK)) {
    console.log('[apply-lix-patch] already patched, no-op');
    return;
  }

  const startIdx = original.indexOf(START_MARK);
  const endIdx = original.indexOf(END_MARK);
  if (startIdx < 0 || endIdx < 0) {
    const sdk = require(path.join('node_modules', '@inlang', 'sdk', 'package.json')).version;
    throw new Error(
      `[apply-lix-patch] markers not found in @inlang/sdk@${sdk} importFiles.js. ` +
      'The SDK shape changed — port this patch to the new layout instead of building.'
    );
  }

  const inner = original.slice(startIdx, endIdx); // legacy single-transaction block, kept verbatim
  const prefixed = prefixBlock();
  fs.writeFileSync(abs, original.slice(0, startIdx) + prefixed + inner + original.slice(endIdx));
  console.log(`[apply-lix-patch] patched ${TARGET} (chunked fresh-project commits)`);
}

// The fast-path block injected between the pre-transaction code and the
// legacy transaction block. Must stay in sync with the code the import
// function otherwise runs: inserting bundles, then messages (v7 ids), then
// variants, in transactions of COMMIT_CHUNK_SIZE rows.
function prefixBlock() {
  return `    const hasExistingBundles = await args.db
        .selectFrom("bundle")
        .select("id")
        .limit(1)
        .executeTakeFirst();
    const bundleIds = new Set();
    let bundlesHaveUniqueIds = true;
    for (const bundle of imported.bundles) {
        if (bundle.id === undefined || bundleIds.has(bundle.id)) {
            bundlesHaveUniqueIds = false;
            break;
        }
        bundleIds.add(bundle.id);
    }
    const messageKeys = new Set();
    let messagesHaveUniqueKeys = true;
    for (const message of imported.messages) {
        const key = messageReferenceKey(message.bundleId, message.locale);
        if (messageKeys.has(key)) {
            messagesHaveUniqueKeys = false;
            break;
        }
        messageKeys.add(key);
    }
    const variantKeys = new Set();
    let variantsHaveUniqueKeys = true;
    for (const variant of imported.variants) {
        if (variant.messageBundleId === undefined ||
            variant.messageLocale === undefined) {
            variantsHaveUniqueKeys = false;
            break;
        }
        const key = variantReferenceKey(variant.messageBundleId, variant.messageLocale, variant.matches);
        if (variantKeys.has(key)) {
            variantsHaveUniqueKeys = false;
            break;
        }
        variantKeys.add(key);
    }
    const canBatchImportFreshProject = hasExistingBundles === undefined &&
        bundlesHaveUniqueIds &&
        messagesHaveUniqueKeys &&
        variantsHaveUniqueKeys &&
        imported.messages.every((message) => message.id === undefined) &&
        imported.variants.every((variant) => variant.id === undefined &&
            variant.messageId === undefined &&
            variant.messageBundleId !== undefined &&
            variant.messageLocale !== undefined) &&
        imported.messages.every((message) => bundleIds.has(message.bundleId)) &&
        imported.variants.every((variant) => messageKeys.has(messageReferenceKey(variant.messageBundleId, variant.messageLocale)));
    if (canBatchImportFreshProject) {
        const ${CHUNK_MARK};
        await args.db.transaction().execute(async (trx) => {
            await insertInBatchesByShape({
                rows: imported.bundles,
                optionalColumns: ["declarations"],
                insert: async (rows) => {
                    await trx.insertInto("bundle").values(rows).execute();
                },
            });
        });
        const messagesWithIds = imported.messages.map((message) => ({
            ...message,
            id: v7(),
        }));
        for (let offset = 0; offset < messagesWithIds.length; offset += COMMIT_CHUNK_SIZE) {
            await args.db.transaction().execute(async (trx) => {
                await insertInBatchesByShape({
                    rows: messagesWithIds.slice(offset, offset + COMMIT_CHUNK_SIZE),
                    optionalColumns: ["selectors"],
                    insert: async (rows) => {
                        await trx.insertInto("message").values(rows).execute();
                    },
                });
            });
        }
        const messageIds = new Map(messagesWithIds.map((message) => [
            messageReferenceKey(message.bundleId, message.locale),
            message.id,
        ]));
        const variantsWithMessageIds = imported.variants.map((variant) => {
            const messageId = messageIds.get(messageReferenceKey(variant.messageBundleId, variant.messageLocale));
            if (messageId === undefined) {
                throw new Error("Imported variant does not reference a message");
            }
            return {
                messageId,
                matches: variant.matches,
                pattern: variant.pattern,
            };
        });
        for (let offset = 0; offset < variantsWithMessageIds.length; offset += COMMIT_CHUNK_SIZE) {
            await args.db.transaction().execute(async (trx) => {
                await insertInBatchesByShape({
                    rows: variantsWithMessageIds.slice(offset, offset + COMMIT_CHUNK_SIZE),
                    optionalColumns: ["matches", "pattern"],
                    insert: async (rows) => {
                        await trx.insertInto("variant").values(rows).execute();
                    },
                });
            });
        }
        return;
    }
`;
}

main();