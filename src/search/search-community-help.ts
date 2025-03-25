import type { SearchClient } from 'algoliasearch/lite'

import algoliasearch from 'algoliasearch/lite'
let searchClient: SearchClient
const appID = process.env.ALGOLIA_APP_ID
const apiKey = process.env.ALGOLIA_PUBLIC_KEY
const indexName = process.env.ALGOLIA_INDEX_NAME
if (appID && apiKey) {
  searchClient = algoliasearch(appID, apiKey)
}
export const algoliaPerPage = 5

export async function searchCommunityHelp(search_term: string): Promise<any> {
  if (!searchClient || !indexName) {
    console.error('Algolia client or index name not found')
    return []
  }
  const results = await searchClient.search([
    {
      indexName,
      params: {
        attributesToRetrieve: [
          'objectID',
          'author',
          'name',
          'createdAt',
          'messages',
          'slug',
          'platform',
        ],
        hitsPerPage: algoliaPerPage,
      },
      query: search_term,
    },
  ])

  // @ts-expect-error
  return results.results[0].hits
}
