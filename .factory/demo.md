# Context Cloze demo sandbox

Open [the demo](/demo) or select **Try it with sample data** on the first screen.

The demo seeds three original, non-copyrighted vocabulary prompts about a field notebook, a thermometer, and inferring meaning from context. It uses the `context-cloze-demo` IndexedDB database. Personal work uses the separate `context-cloze-real` database, so demo actions never read or write the personal bank.

The persistent banner says **Demo — sample data, nothing is saved**. **Reset demo** replaces the demo database with the three original prompts. **Start for real** discards demo records and opens the separate real bank. `/demo` is available after a first visit while offline.
