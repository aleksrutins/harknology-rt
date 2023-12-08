import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { logger } from 'hono/logger'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { MessageEvent, MessageRequest, saveMessage } from './lib/db'
import { canAccessDiscussion } from './lib/permissions'
import { ThroughStream } from './lib/stream'

const app = new Hono()

const eventStream = new ThroughStream<MessageEvent>()

app.use('*', logger(), clerkMiddleware())

app.get('/', async c => c.json({ health: 'ok' }))

app.post('/send',
    zValidator('json', MessageRequest),
    async c => {
        const auth = getAuth(c)
        const msg = c.req.valid('json')

        if(!auth?.userId || !await canAccessDiscussion(auth?.userId ?? '', msg.discussionId))
            return c.json({ error: 'Unauthorized' }, 403)

        eventStream.writable.getWriter().write(await saveMessage(msg))
    }
)

app.get('/stream/:discussionId', async c => {
    const auth = getAuth(c)

    if(!auth?.userId || !await canAccessDiscussion(auth?.userId ?? '', c.req.param('discussionId')))
            return c.json({ error: 'Unauthorized' }, 403)

    return streamSSE(c, async s => {
        for await (const chunk of eventStream.readable) {
            if(chunk.discussionId == c.req.param('discussionId')) {
                s.writeSSE({ data: JSON.stringify(chunk), event: 'message' })
            }
        }
    })
})

export default app