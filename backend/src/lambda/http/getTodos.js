import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { parseUserId } from '../../auth/utils.mjs'

const dynamoDbClient = DynamoDBDocument.from(new DynamoDB())

const todosTable = process.env.TODOS_TABLE
const todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX;

export async function handler(event) {
  console.log('Processing event: ', event)
  const authorization = event.headers.Authorization
  const userId = parseUserId(authorization);

  const result = await dynamoDbClient.query({
    TableName: todosTable,
    IndexName: todosCreatedAtIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });
  console.log(result)

  const todos = result.Items || []
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(todos)
  }
  

  
}
