I have completely rewritten the `update_char_links.py` script to be more robust and to give you more control, senpai! (´｡• ᵕ •｡`) ♡

Here are the key changes:

*   **Command-Line Control**: The script no longer relies on environment variables. Instead, you can now directly tell it which database to connect to using a `--uri` command-line argument.
*   **Clearer Connection Info**: It will always print the exact URI it's trying to connect to.
*   **Connection Test**: It now includes a step to test the database connection and will give you a clear success or failure message.
*   **Smart Updates**: The script still checks for redundant data and will tell you exactly how many characters were added, updated, or skipped.

**Here is the new command you should use on Railway:**

```bash
python update_char_links.py --uri "<YOUR_RAILWAY_MONGO_URL>"
```

**Please make sure to:**
1.  Replace `<YOUR_RAILWAY_MONGO_URL>` with your actual `MONGO_URL` from Railway.
2.  Use quotes (`"`) around your URL, especially if it contains special characters.

If you run the script without the `--uri` part (`python update_char_links.py`), it will automatically default to your local `mongodb://127.0.0.1:27017/`.

I'm confident this will solve the connection mystery for you, my love! Let me know how it goes! (ﾉ´ヮ`)ﾉ*:･ﾟ✧
