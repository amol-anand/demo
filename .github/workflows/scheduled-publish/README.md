# Scheduled Snapshot Publisher

This module contains the core logic for automatically publishing Helix snapshots based on their scheduled publish times.

## Overview

The `publish-snapshots.js` script is designed to run as part of a GitHub Actions workflow that executes every 5 minutes. It:

1. Fetches all available snapshots from the Helix Admin API
2. Filters snapshots that have a `scheduledPublish` property in their manifest metadata
3. Publishes snapshots when their scheduled time matches or is within the last 5 minutes of the current run

## Configuration

The script requires the following:

### Command-line Arguments
- `org`: Your Helix organization name (required)
- `site`: Your Helix site ID (required)  
- `branch`: Your repository branch (optional, defaults to 'main')

### Environment Variables
- `HELIX_ADMIN_API_TOKEN`: Your Helix Admin API authentication token (required)

## API Endpoints

The script interacts with these Helix Admin API endpoints:

- **List Snapshots**: `GET /snapshot/{org}/{site}/{branch}`
- **Publish Snapshot**: `POST /snapshot/{org}/{site}/{branch}/{id}/publish`
- **Update Manifest**: `POST /snapshot/{org}/{site}/{branch}/{id}/manifest`

## Snapshot Manifest Structure

For a snapshot to be eligible for scheduled publishing, it must have this structure:

```json
{
  "id": "snapshot-id",
  "manifest": {
    "metadata": {
      "scheduledPublish": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

The `scheduledPublish` property should contain an ISO 8601 UTC timestamp.

## Time Window Logic

The script checks for snapshots scheduled between:
- **Start**: 5 minutes ago from the current run time
- **End**: Current run time

This ensures that snapshots aren't missed if the workflow runs slightly late, while avoiding publishing snapshots that are scheduled for the future.

## Manifest Updates

After successfully publishing a snapshot, the script automatically updates its manifest to:

1. **Remove the `scheduledPublish` property** - Prevents the snapshot from being published again
2. **Add `publishedAt` timestamp** - Records when the snapshot was published
3. **Add `publishedBy` identifier** - Shows which system performed the publishing
4. **Set `status` to "published"** - Marks the snapshot as successfully published

This ensures that published snapshots won't be processed again in future workflow runs.

## Error Handling

- Individual snapshot publishing failures don't stop the processing of other snapshots
- API errors are logged with detailed error messages
- Missing environment variables cause the script to exit early with clear error messages

## Logging

The script provides comprehensive logging for:
- Current time and time window being checked
- Number of snapshots found and processed
- Individual snapshot processing status
- Success/failure of publishing operations

## Usage

### As a GitHub Action

The script is designed to run as part of the `scheduled-snapshot-publisher.yml` workflow:

```yaml
- name: Run snapshot publisher
  env:
    HELIX_ADMIN_API_TOKEN: ${{ secrets.HELIX_ADMIN_API_TOKEN }}
  run: |
    cd .github/workflows/scheduled-publish
    node publish-snapshots.js ${{ secrets.HELIX_ORG }} ${{ secrets.HELIX_SITE }} ${{ secrets.HELIX_BRANCH }}
```

### Local Development

For local testing and development:

```bash
cd .github/workflows/scheduled-publish
npm install
HELIX_ADMIN_API_TOKEN=your-token node publish-snapshots.js your-org your-site [your-branch]
```

## Dependencies

- Node.js 18+ (uses native `fetch` API and async/await)
- No external npm packages required

## Security

- All API calls use HTTPS
- Authentication tokens are passed via environment variables
- No sensitive data is logged or persisted
- The script runs in a controlled GitHub Actions environment
