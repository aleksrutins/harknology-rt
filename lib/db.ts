import connect from 'postgres'
import { z } from 'zod'

export const sql = connect()

export const MessageRequest = z.object({
    discussionId: z.string(),
    posterId: z.string(),
    content: z.string(),
    inReplyTo: z.array(z.string())
})

export type TMessageRequest = z.infer<typeof MessageRequest>

export type MessageEvent = TMessageRequest & {
    id: string,
    postedAt: Date,
    updatedAt: Date
}

export async function saveMessage(msg: TMessageRequest): Promise<MessageEvent> {
    const [{ id, created_at, updated_at }] = (await sql<[{ id: string, created_at: Date, updated_at: Date }]>`
        insert into "Response"
            (discussion_id, poster_id, content)
        values
            (${msg.discussionId}, ${msg.posterId}, ${msg.content})
        returning (id, created_at, updated_at)
    `)

    for(const reply of msg.inReplyTo) await sql`
        insert into "Reply"
            (from_id, to_id)
        values
            (${id}, ${reply})
    `

    return {
        id,
        postedAt: created_at,
        updatedAt: updated_at,
        ...msg
    }
}