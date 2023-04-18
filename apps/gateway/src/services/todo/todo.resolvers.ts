import { resolve, virtual } from '@feathersjs/schema'
import { Todo } from 'todo-component'
import { User } from 'user-component'
import { HookContext } from '../../declarations'

type TodoResolved = Todo & { user?: User }

export const todoCreateDataResolver = resolve<Todo, HookContext>({
  userId: async (value, todo, context) => {
    const { params } = context
    const { user } = params
    return user.id
  }
})

export const todoResultResolver = resolve<TodoResolved, HookContext>({
  user: virtual(async (todo, context) => {
    if (!todo.userId) {
      return undefined
    }
    const { app } = context
    const user = await app.service('users').get(todo.userId)
    return user
  })
})
