const fs = require('fs');
let content = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

// Also include the webhook URL payload fixes here so we do it all in one script!
content = content.replace(/uses: slackapi\/slack-github-action@v1\.24\.0\s+if: success\(\)\s+with:\s+webhook-url: \$\{\{ secrets\.SLACK_WEBHOOK \}\}\s+payload: \|/, 
`uses: slackapi/slack-github-action@v1.24.0
        if: success()
        env:
          SLACK_WEBHOOK_URL: \$\{\{ secrets.SLACK_WEBHOOK \}\}
        with:
          payload: |`);

content = content.replace(/uses: slackapi\/slack-github-action@v1\.24\.0\s+if: failure\(\)\s+with:\s+webhook-url: \$\{\{ secrets\.SLACK_WEBHOOK \}\}\s+payload: \|/, 
`uses: slackapi/slack-github-action@v1.24.0
        if: failure()
        env:
          SLACK_WEBHOOK_URL: \$\{\{ secrets.SLACK_WEBHOOK \}\}
        with:
          payload: |`);

content = content.replace(/uses: slackapi\/slack-github-action@v1\.24\.0\s+with:\s+webhook-url: \$\{\{ secrets\.SLACK_WEBHOOK \}\}\s+payload: \|/, 
`uses: slackapi/slack-github-action@v1.24.0
        env:
          SLACK_WEBHOOK_URL: \$\{\{ secrets.SLACK_WEBHOOK \}\}
        with:
          payload: |`);

// Now apply the bracket syntax to silence the warnings!
content = content.replace(/secrets\.([A-Za-z0-9_]+)/g, "secrets['$1']");

fs.writeFileSync('.github/workflows/deploy.yml', content);
console.log('Done!');
