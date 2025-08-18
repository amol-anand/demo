/**
 * Scheduled Snapshot Publisher
 * 
 * This script automatically publishes snapshots based on their scheduled publish times.
 * 
 * API Endpoints used:
 * - GET /snapshot/{org}/{site}/{branch} - List all snapshots
 * - POST /snapshot/{org}/{site}/{branch}/{id}?publish=true - Publish a snapshot
 * - POST /snapshot/{org}/{site}/{branch}/{id}/manifest - Update snapshot manifest
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
    const snapshotsResponse = await fetch(
      `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `token ${ADMIN_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(res => res.json());
    
    if (!snapshotsResponse.snapshots || !Array.isArray(snapshotsResponse.snapshots)) {
      console.log('No snapshots found or invalid response format');
      return;
    }
    
    console.log(`Found ${snapshotsResponse.snapshots.length} snapshots`);
    
    // Filter snapshots with scheduledPublish property
    const scheduledSnapshots = snapshotsResponse.snapshots.filter(snapshot => {
      return snapshot.manifest && 
             snapshot.manifest.metadata && 
             snapshot.manifest.metadata.scheduledPublish;
    });
    
    console.log(`Found ${scheduledSnapshots.length} snapshots with scheduledPublish property`);
    
    // Check each scheduled snapshot
    for (const snapshot of scheduledSnapshots) {
      const scheduledTime = new Date(snapshot.manifest.metadata.scheduledPublish);
      console.log(`Snapshot ${snapshot.id}: scheduled for ${scheduledTime.toISOString()}`);
      
      // Check if scheduled time is within the last 5 minutes or matches current time
      if (scheduledTime <= now && scheduledTime >= fiveMinutesAgo) {
        console.log(`Publishing snapshot ${snapshot.id}...`);
        
        try {
          // Publish the snapshot
          const publishResponse = await fetch(
            `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot.id}?publish=true`,
            {
              method: 'POST',
              headers: {
                'Authorization': `token ${ADMIN_API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          ).then(res => res.json());
          
          console.log(`Successfully published snapshot ${snapshot.id}`);
          
          // Update the manifest to remove scheduledPublish property and mark as published
          try {
            console.log(`Updating manifest for snapshot ${snapshot.id}...`);
            
            // Create updated manifest without scheduledPublish and with published metadata
            const updatedManifest = {
              ...snapshot.manifest,
              metadata: {
                ...snapshot.manifest.metadata,
                publishedAt: new Date().toISOString(),
                publishedBy: 'scheduled-snapshot-publisher',
                status: 'published'
              }
            };
            
            // Remove the scheduledPublish property
            delete updatedManifest.metadata.scheduledPublish;
            
            // Update the snapshot manifest
            const manifestResponse = await fetch(
              `${ADMIN_API_BASE}/snapshot/${ORG}/${SITE}/${BRANCH}/${snapshot.id}/manifest`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `token ${ADMIN_API_TOKEN}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedManifest)
              }
            ).then(res => res.json());
            
            console.log(`Successfully updated manifest for snapshot ${snapshot.id}`);
            
          } catch (manifestError) {
            console.error(`Failed to update manifest for snapshot ${snapshot.id}:`, manifestError.message);
            // Don't fail the entire process if manifest update fails
            // The snapshot was still published successfully
          }
          
        } catch (error) {
          console.error(`Failed to publish snapshot ${snapshot.id}:`, error.message);
        }
      } else {
        console.log(`Snapshot ${snapshot.id} not ready for publishing yet`);
      }
    }
    
    console.log('Scheduled snapshot publishing check completed');
    
  } catch (error) {
    console.error('Error in main function:', error.message);
    process.exit(1);
  }
}

main();
