import algoliasearch, { SearchClient } from 'algoliasearch/lite';
let searchClient: SearchClient;
const docs_appID = process.env.ALGOLIA_DOCS_APP_ID;
const docs_apiKey = process.env.ALGOLIA_DOCS_PUBLIC_KEY;
const docs_indexName = process.env.ALGOLIA_DOCS_INDEX_NAME;
if (docs_appID && docs_apiKey) searchClient = algoliasearch(docs_appID, docs_apiKey);
export const algoliaPerPage = 5;

export async function searchDocs(search_term: string): Promise<any> {
  if (!searchClient || !docs_indexName) {
    console.error('Algolia client or index name not found');
    return [];
  }
  const results = await searchClient.search([
    {
      indexName: docs_indexName,
      query: search_term,
      params: {
        hitsPerPage: algoliaPerPage,
        attributesToRetrieve: ['objectID', 'url', 'type', 'anchor'],
      },
    },
  ]);

  // @ts-ignore
  return results.results[0].hits;
}
