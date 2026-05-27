#!/bin/bash
# List available Anthropic model IDs.
# Usage: ANTHROPIC_API_KEY=sk-ant-... ./scripts/list-anthropic-models.sh

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Set ANTHROPIC_API_KEY first:"
  echo "  ANTHROPIC_API_KEY=sk-ant-... ./scripts/list-anthropic-models.sh"
  exit 1
fi

curl -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'data' in data:
    ids = sorted([m['id'] for m in data['data']])
    print(f'{len(ids)} models available:')
    for mid in ids:
        print(f'  {mid}')
elif 'error' in data:
    print('ERROR:', data['error'].get('message', json.dumps(data['error'])))
else:
    print(json.dumps(data, indent=2))
"
