const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment config
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, val] = line.split('=');
        if (key && val) acc[key.trim()] = val.trim();
        return acc;
    }, {});

const SECRET = envConfig.RENDERKIT_RELAY_SECRET;
const PORT = envConfig.RENDERKIT_RELAY_PORT || 8787;
const BYPASS_CACHE = envConfig.RENDERKIT_RELAY_LOADTEST_BYPASS_CACHE === '1';

if (!SECRET) {
    console.error('Error: RENDERKIT_RELAY_SECRET not found in .env');
    process.exit(1);
}

// Blocks to test
const BLOCKS = [
    {
        name: 'renderkit/hero',
        props: {
            attributes: {
                heading: 'Load Test & Performance',
                description: 'Testing the limits of SSR performance with high concurrency.',
                buttonText: 'Learn More',
                buttonUrl: '#',
                theme: 'dark',
                enableAnimations: true,
                variant: 'full',
                stat1Label: 'Stat 1',
                stat1Value: '100%',
                stat2Label: 'Stat 2',
                stat2Value: 'OK',
            }
        }
    },
    {
        name: 'renderkit/product-grid',
        props: {
            attributes: {
                products: [
                    { id: 1, title: 'Test Product 1', excerpt: 'Best Seller', url: '#', price: 99.99, sale_price: 0, image: null, stock_status: 'instock' },
                    { id: 2, title: 'Test Product 2', excerpt: 'New Arrival', url: '#', price: 149.99, sale_price: 129.99, image: null, stock_status: 'instock' },
                    { id: 3, title: 'Test Product 3', excerpt: 'Limited', url: '#', price: 299.99, sale_price: 0, image: null, stock_status: 'instock' },
                    { id: 4, title: 'Test Product 4', excerpt: 'Featured', url: '#', price: 49.99, sale_price: 0, image: null, stock_status: 'instock' },
                ],
                columns: 4,
                showPrice: true,
                count: 4,
                category: 0,
                showButton: true,
            }
        }
    },
    {
        name: 'renderkit/navigation',
        props: {
            attributes: {
                menuItems: [
                    { id: 1, title: 'Home', url: '/' },
                    { id: 2, title: 'Shop', url: '/shop' },
                    { id: 3, title: 'Contact', url: '/contact' }
                ],
                siteName: 'RenderKit Demo',
                showLogo: false,
                logoUrl: '',
                sticky: true,
                theme: 'light',
                showCart: false,
                menuSlug: 'renderkit-primary',
            }
        }
    },
    {
        name: 'renderkit/text-block',
        props: {
            attributes: {
                theme: 'light',
                width: 'narrow',
            },
            content: '<h2>Hello World</h2><p>This is a test.</p>',
        }
    },
    {
        name: 'renderkit/footer',
        props: {
            attributes: {
                siteName: 'RenderKit Demo',
                tagline: 'High performance blocks',
                menuItems: [
                    { id: 1, title: 'Privacy', url: '/privacy' },
                    { id: 2, title: 'Imprint', url: '/imprint' }
                ],
                showLogo: false,
                logoUrl: '',
                theme: 'dark'
            }
        }
    },
];

let requestsSent = 0;
let errors = 0;

function sendRequest() {
    const block = BLOCKS[Math.floor(Math.random() * BLOCKS.length)];
    const props = JSON.parse(JSON.stringify(block.props));

    if (BYPASS_CACHE) {
        // Mutate a schema-allowed attribute that does not affect the HTML output (for most blocks),
        // so we can measure cold renders without changing markup.
        if (block.name === 'renderkit/hero') {
            props.attributes.stat1Value = String(Math.random());
        } else if (block.name === 'renderkit/product-grid') {
            props.attributes.count = Math.floor(Math.random() * 1000);
        } else if (block.name === 'renderkit/navigation') {
            props.attributes.menuSlug = `renderkit-primary-${Math.floor(Math.random() * 1000)}`;
        } else if (block.name === 'renderkit/footer') {
            props.attributes.menuSlug = `renderkit-footer-${Math.floor(Math.random() * 1000)}`;
        } else if (block.name === 'renderkit/text-block') {
            props.content = `${props.content || ''}<!-- ${Math.random()} -->`;
        }
    }

    const payload = { block: block.name, props };

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(`${timestamp}.${body}`)
        .digest('hex');

    const options = {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/render',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-RenderKit-Relay-Timestamp': timestamp,
            'X-RenderKit-Relay-Signature': `sha256=${signature}`,
        },
    };

    const req = http.request(options, (res) => {
        requestsSent++;
        if (res.statusCode !== 200) {
            errors++;
            process.stdout.write('x');
            // Log first error
            if (errors === 1) {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => console.log('\nError response:', res.statusCode, data));
            }
        } else {
            process.stdout.write('.');
        }
    });

    req.on('error', (e) => {
        errors++;
        process.stdout.write('E');
    });

    req.write(body);
    req.end();
}

console.log(`Starting load test on port ${PORT}...`);
console.log(`Bypass cache: ${BYPASS_CACHE ? 'ON' : 'OFF'} (set RENDERKIT_RELAY_LOADTEST_BYPASS_CACHE=1 in relay/.env)`);
console.log('Press Ctrl+C to stop');

// Burst mode: Send batches of requests
setInterval(() => {
    const batchSize = Math.floor(Math.random() * 5) + 1; // 1-5 requests
    for (let i = 0; i < batchSize; i++) {
        sendRequest();
    }
}, 100); // Every 100ms -> ~10-50 req/sec

// Report stats
setInterval(() => {
    console.log(`\nSent: ${requestsSent} | Errors: ${errors} | Rate: ~${requestsSent / 5} req/s`);
    requestsSent = 0;
    errors = 0;
}, 5000);
