import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('utils')
/**
 * Parse an authorization header
 * @param authorizationHeader authorization header to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(authorizationHeader) {
  const split = authorizationHeader.split(' ')
  const jwtToken = split[1]

  const decodedJwt = jsonwebtoken.decode(jwtToken)
  return decodedJwt.sub
}
