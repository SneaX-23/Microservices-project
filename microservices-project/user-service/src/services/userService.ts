import {prisma} from "../db/prisma";

export const GetUserEmail = async (id: string) => {
    return prisma.user.findUnique({
        where: {id: id}
    })
}