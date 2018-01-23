import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as bcrypt from 'bcryptjs'
import * as validator from 'validator'

interface Mentor {
  id: string
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

    if (!validator.isEmail(email)) {
      return { error: 'Not a valid email' }
    }

    // check if user exists already
    const userExists: boolean = await getMentor(api, email)
      .then(r => r.Mentor !== null)
    if (userExists) {
      return { error: 'Email already in use' }
    }

    // create password hash
    const salt = bcrypt.genSaltSync(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)

    // create new user
    const userId = await createGraphcoolMentor(api, email, hash)

    // generate node token for new Mentor node
    const token = await graphcool.generateNodeToken(userId, 'Mentor')

    return { data: { id: userId, token } }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured during signup.' }
  }
}

async function getMentor(api: GraphQLClient, email: string): Promise<{ Mentor }> {
  const query = `
    query getMentor($email: String!) {
      Mentor(email: $email) {
        id
      }
    }
  `

  const variables = {
    email,
  }

  return api.request<{ Mentor }>(query, variables)
}

async function createGraphcoolMentor(api: GraphQLClient, email: string, password: string): Promise<string> {
  const mutation = `
    mutation createGraphcoolMentor($email: String!, $password: String!) {
      createMentor(
        email: $email,
        password: $password
      ) {
        id
      }
    }
  `

  const variables = {
    email,
    password: password,
  }

  return api.request<{ createMentor: Mentor }>(mutation, variables)
    .then(r => r.createMentor.id)
}
