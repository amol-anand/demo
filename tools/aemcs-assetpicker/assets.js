/* eslint-disable no-undef */
// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

// Helper function to load external scripts
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Configuration cache
const CONFS = {};

// Fetch configuration from DA Live
async function fetchConf(path) {
  if (CONFS[path]) {
    return CONFS[path];
  }

  try {
    const { context } = await DA_SDK;
    const configUrl = `https://content.da.live/${context.org}/${context.repo}/.da/config.json`;
    const response = await fetch(configUrl);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const data = json.data || [];

    if (!data) {
      return null;
    }

    CONFS[path] = data;
    return data;
  } catch (error) {
    return null;
  }
}

// Get a specific configuration value
async function fetchValue(path, key) {
  if (CONFS[path]?.[key]) {
    return CONFS[path][key];
  }

  const data = await fetchConf(path);
  if (!data) {
    return null;
  }

  const confKey = data.find((conf) => conf.key === key);
  if (!confKey) {
    return null;
  }

  return confKey.value;
}

// Get configuration key for owner and repo
async function getConfKey(owner, repo, key) {
  const path = 'config';
  const value = await fetchValue(path, key);
  return value;
}

// Transform Scene7 URL to include /is/image/ for DM S7 links
function transformDms7Url(originalUrl, dms7Options = '') {
  if (!originalUrl) {
    return originalUrl;
  }

  const urlParts = originalUrl.split('/');
  const domainIndex = urlParts.findIndex((part) => part.includes('scene7.com'));

  if (domainIndex !== -1) {
    urlParts.splice(domainIndex + 1, 0, 'is', 'image');
    return urlParts.join('/') + dms7Options;
  }
  return originalUrl;
}

// Initialize the Asset Selector
async function init() {
  try {
    const { context, token, actions } = await DA_SDK;

    if (!window.PureJSSelectors) {
      const ASSET_SELECTOR_URL = 'https://experience.adobe.com/solutions/CQ-assets-selectors/assets/resources/assets-selectors.js';
      await loadScript(ASSET_SELECTOR_URL);
    }

    const container = document.getElementById('asset-selector-container');
    if (!container) {
      return;
    }

    const owner = context.org || '';
    const repo = context.repo || '';

    const repositoryId = await getConfKey(owner, repo, 'aem.repositoryId') || '';

    // Check if repositoryId is empty and show configuration message
    if (!repositoryId) {
      container.innerHTML = `
        <div style="color: #d32f2f; padding: 20px; border: 1px solid #d32f2f; border-radius: 4px; background-color: #ffebee; 
             position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             max-width: 80%; width: 600px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000;">
          <h3 style="margin-top: 0;">Configuration Required</h3>
          <p>The Asset Selector requires a repository ID to function properly.</p>
          <p>Please configure the <strong>aem.repositoryId</strong> in your config file:</p>
          <ol>
            <li>Navigate to <code>https://content.da.live/${owner}/${repo}/.da/config.json</code></li>
            <li>Add or update the configuration with the following key-value pair:</li>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
{
  "key": "aem.repositoryId",
  "value": "your-repository-id"
}</pre>
            <li>Save the changes and refresh this page</li>
          </ol>
        </div>
      `;
      return;
    }

    const aemTierType = repositoryId.includes('delivery') ? 'delivery' : 'author';
    const useDms7Links = await getConfKey(owner, repo, 'aem.assets.image.type') === 'dms7link';
    const dms7Options = useDms7Links ? (await getConfKey(owner, repo, 'aem.assets.dm.options') || '') : '';

    const selectorProps = {
      imsToken: token,
      repositoryId,
      aemTierType,
      handleSelection: (assets) => {
        assets.forEach((asset) => {
          if (asset.type === 'folder') {
            return;
          }

          const assetUrl = asset.path || asset.href || asset.downloadUrl || asset.url;
          const scene7Url = asset['repo:dmScene7Url'];

          if (!assetUrl) {
            return;
          }

          let finalUrl = assetUrl;

          if (useDms7Links && scene7Url) {
            finalUrl = transformDms7Url(scene7Url, dms7Options);
          }

          const assetName = asset.name || asset.title || asset.label || finalUrl.split('/').pop();
          const assetHtml = `<a href="${finalUrl}" class="asset">${assetName}</a>`;

          if (actions?.sendHTML) {
            actions.sendHTML(assetHtml);
            actions.closeLibrary();
          }
        });
      },
      config: {
        selection: {
          allowFolderSelection: false,
          allowMultiSelection: true,
        },
      },
    };

    window.PureJSSelectors.renderAssetSelector(container, selectorProps);
    window.DA_TOKEN = token;
  } catch (error) {
    document.getElementById('asset-selector-container').innerHTML = `
      <div style="color: red; padding: 20px;">
        Error initializing Asset Selector: ${error.message}
      </div>
    `;
  }
}

init();