import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'

interface Mentor {
  id: string
}

export default async (event: FunctionEvent<{}>) => {
  console.log(event)

  try {
    // no logged in user
    if (!event.context.auth || !event.context.auth.nodeId) {
      return { data: null }
    }

    const userId = event.context.auth.nodeId
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')

    // get user by id
    const user: Mentor = await getMentor(api, userId)
      .then(r => r.Mentor)

    // no logged in user
    if (!user || !user.id) {
      return { data: null }
    }

    return { data: { id: user.id } }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured during authentication.' }
  }
}

async function getMentor(api: GraphQLClient, id: string): Promise<{ Mentor }> {
  const query = `
    query getMentor($id: ID!) {
      Mentor(id: $id) {
        id
      }
    }
  `

  const variables = {
    id,
  }

  return api.request<{ Mentor }>(query, variables)
}
