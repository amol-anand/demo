/**
 * Scheduled Snapshot Publisher
 * 
 * This script automatically publishes snapshots based on their scheduled publish times.
 * 
 * API Endpoints used:
 * - GET /snapshot/{org}/{site}/{branch} - List all snapshots
 * - POST /snapshot/{org}/{site}/{branch}/{id}?publish=true - Publish a snapshot
 * - POST /snapshot/{org}/{site}/{branch}/{id} - Update snapshot manifest
 */

// Configuration - org, site, and branch are passed as command-line arguments
const args = process.argv.slice(2);
const ORG = args[0];
const SITE = args[1];
const BRANCH = args[2] || 'main';
const ADMIN_API_TOKEN = process.env.HELIX_ADMIN_API_TOKEN;
const ADMIN_API_BASE = 'https://admin.hlx.page';

if (!ORG || !SITE || !ADMIN_API_TOKEN) {
  console.error('Usage: node publish-snapshots.js <org> <site> [branch]');
  console.error('Example: node publish-snapshots.js adobe helix-website main');
  console.error('');
  console.error('Environment variables:');
  console.error('  HELIX_ADMIN_API_TOKEN: Your Helix Admin API authentication token');
  console.error('');
  console.error('Missing required arguments or environment variables');
  process.exit(1);
}

// Get current time in UTC
const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

console.log(`Current time (UTC): ${now.toISOString()}`);
console.log(`Checking for snapshots scheduled between ${fiveMinutesAgo.toISOString()} and ${now.toISOString()}`);

async function main() {
  try {
    // List all snapshots
    console.log('Fetching snapshots...');
    const snapshotsList = await fetch(
      `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `token ${ADMIN_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(res => res.json());
    
    if (!snapshotsList.snapshots || !Array.isArray(snapshotsList.snapshots)) {
      console.log('No snapshots found or invalid response format');
      return;
    }
    console.log(`Found ${snapshotsList.snapshots.length} snapshots`);
    const scheduledSnapshots = [];
    // Get the manifest for each snapshot and filter snapshots with scheduledPublish property
    await Promise.all(snapshotsList.snapshots.map(async (snapshot) => {
      const manifestResponse = await fetch(
        `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `token ${ADMIN_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      ).then(res => res.json());
      if (manifestResponse.manifest && manifestResponse.manifest.metadata && manifestResponse.manifest.metadata.scheduledPublish) {
        console.log(`Found scheduled snapshot ${snapshot}`);
        scheduledSnapshots.push(manifestResponse);
      }
    }));
    
    console.log(`Found ${scheduledSnapshots.length} snapshots with scheduledPublish property`);
    
    // Check each scheduled snapshot
    for (const snapshot of scheduledSnapshots) {
      const scheduledTime = new Date(snapshot.manifest.metadata.scheduledPublish);
      console.log(`Snapshot ${snapshot.manifest.id}: scheduled for ${scheduledTime.toISOString()}`);
      
      // Check if scheduled time is in the past
      if (scheduledTime <= now && scheduledTime > fiveMinutesAgo) {
        console.log(`Publishing snapshot ${snapshot.manifest.id}...`);
        console.log(`${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot.manifest.id}?publish=true`);
        try {
          // Publish the snapshot
          const publishResponse = await fetch(
            `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot.manifest.id}?publish=true`,
            {
              method: 'POST',
              headers: {
                'Authorization': `token ${ADMIN_API_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                publish: true
              })
            }
          ).then(res => res.json());
          console.log(publishResponse);
          console.log(`Successfully published snapshot ${snapshot.manifest.id}`);
          
          // Update the manifest to remove scheduledPublish property and mark as published
          try {
            console.log(`Updating manifest for snapshot ${snapshot.manifest.id}...`);
            
            // Create updated manifest without scheduledPublish and with published metadata
            const updatedManifest = {
              title: snapshot.manifest.title || '',
              description: snapshot.manifest.description || '',
              locked: snapshot.manifest.locked || false,
              metadata: {
                publishedAt: new Date().toISOString(),
                publishedBy: 'scheduled-snapshot-publisher',
                status: 'published'
              }
            };            
            console.log(updatedManifest);
            // Update the snapshot manifest
            const manifestResponse = await fetch(
              `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot.manifest.id}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `token ${ADMIN_API_TOKEN}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedManifest)
              }
            ).then(res => res.json());
            
            console.log(`Successfully updated manifest for snapshot ${snapshot.manifest.id}`);
            
          } catch (manifestError) {
            console.error(`Failed to update manifest for snapshot ${snapshot.manifest.id}:`, manifestError.message);
            // Don't fail the entire process if manifest update fails
            // The snapshot was still published successfully
          }
          
        } catch (error) {
          console.error(`Failed to publish snapshot ${snapshot.manifest.id}:`, error.message);
        }
      } else {
        console.log(`Snapshot ${snapshot.manifest.id} not ready for publishing yet`);
      }
    }
    
    console.log('Scheduled snapshot publishing check completed');
    
  } catch (error) {
    console.error('Error in main function:', error.message);
    process.exit(1);
  }
}

await main();
