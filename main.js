const Apify = require('apify');

// Apify.utils contains various utilities, e.g. for logging.
// Here we turn off the logging of unimportant messages.
const { log } = Apify.utils;
log.setLevel(log.LEVELS.WARNING);

// Apify.main() function wraps the crawler logic (it is optional).
Apify.main(async () => {
    // Create and initialize an instance of the RequestList class that contains
    // a list of URLs to crawl. Here we use just a few hard-coded URLs.
    const requestList = new Apify.RequestList({
        sources: [
            	{ url: 'https://coinmarketcap.com' },
        ],
    });
    await requestList.initialize();

    // Create an instance of the CheerioCrawler class - a crawler
    // that automatically loads the URLs and parses their HTML using the cheerio library.
    const crawler = new Apify.CheerioCrawler({
        // Let the crawler fetch URLs from our list.
        requestList,

        // The crawler downloads and processes the web pages in parallel, with a concurrency
        // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
        // Here we define some hard limits for the concurrency.
        minConcurrency: 1,
        maxConcurrency: 20,

        // On error, retry each page at most once.
        maxRequestRetries: 1,

        // Increase the timeout for processing of each page.
        handlePageTimeoutSecs: 60,

        // This function will be called for each URL to crawl.
        // It accepts a single parameter, which is an object with the following fields:
        // - request: an instance of the Request class with information such as URL and HTTP method
        // - html: contains raw HTML of the page
        // - $: the cheerio object containing parsed HTML
        handlePageFunction: async ({ request, body, $ }) => {
            console.log(`Processing ${request.url}...`);
            // Extract data from the page using cheerio.
            const title = $('title').text();           
            
            const name = [];
            $('.cmc-table__column-name.sc-1kxikfi-0.eTVhdN').each((i, el) => {
                const text = $(el).text();
                name.push(text);
            });
            
            const price = [];
            $('tbody tr.cmc-table-row td.cmc-table__cell.cmc-table__cell--sortable.cmc-table__cell--right.cmc-table__cell--sort-by__price').each((i, el) => {
                const text = $(el).text();
                price.push(text);
            });
            
            const marketCap = [];
            $('tbody tr.cmc-table-row td.cmc-table__cell.cmc-table__cell--sortable.cmc-table__cell--right.cmc-table__cell--sort-by__market-cap').each((i, el) => {
                const text = $(el).text();
                marketCap.push(text);
            });
            
            const volume = [];
            $('tbody tr.cmc-table-row td.cmc-table__cell.cmc-table__cell--sortable.cmc-table__cell--right.cmc-table__cell--sort-by__volume-24-h').each((i, el) => {
                const text = $(el).text();
                volume.push(text);
            });
            
            const change = [];
            $('tbody tr.cmc-table-row td.cmc-table__cell.cmc-table__cell--sortable.cmc-table__cell--right.cmc-table__cell--sort-by__percent-change-24-h').each((i, el) => {
                const text = $(el).text();
                change.push(text);
            });
            
            // Store the results to the default dataset. In local configuration,
            // the data will be stored as JSON files in ./apify_storage/datasets/default

            await Apify.pushData({
                url: request.url,
                title,
                name,
                price,
                marketCap,
                volume,
                change,
            }); 
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed twice.`);
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});
