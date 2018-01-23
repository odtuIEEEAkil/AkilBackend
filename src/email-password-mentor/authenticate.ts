import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as bcrypt from 'bcryptjs'

interface Mentor {
  id: string
  password: string
}

interface EventData {
  email: string
  password: string
}

const SALT_ROUNDS = 10

export default async (event: FunctionEvent<EventData>) => {
  console.log(event)

  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')

    const { email, password } = event.data

    // get user by email
    const user: Mentor = await getMentorByEmail(api, email)
      .then(r => r.Mentor)

    // no user with this email
    if (!user) {
      return { error: 'Invalid credentials!' }
    }

    // check password
    const passwordIsCorrect = await bcrypt.compare(password, user.password)
    if (!passwordIsCorrect) {
      return { error: 'Invalid credentials!' }
    }

    // generate node token for existing Mentor node
    const token = await graphcool.generateNodeToken(user.id, 'Mentor')

    return { data: { id: user.id, token} }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured during authentication.' }
  }
}

async function getMentorByEmail(api: GraphQLClient, email: string): Promise<{ Mentor }> {
  const query = `
    query getMentorByEmail($email: String!) {
      Mentor(email: $email) {
        id
        password
      }
    }
  `

  const variables = {
    email,
  }

  return api.request<{ Mentor }>(query, variables)
}
