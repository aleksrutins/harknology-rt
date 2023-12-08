import { sql } from "./db";

export const canAccessDiscussion = (userId: string, discussionId: string) =>
    sql<[{can_access: boolean}]>`
        select (
            (
                (select count(*) from StudentClasses
                    where class_id =
                        (select class_id from Discussion where id = ${discussionId})
                    and student_id = ${userId})
                > 0
            )
        or
            (
                ${userId} =
                    (select teacher_id from Class where id =
                        (select class_id from Discussion where id = ${discussionId}))
            )
        ) as can_access
    `.then(a => a[0].can_access)