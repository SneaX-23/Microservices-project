import {prisma} from "../db/prisma";

export const GetUser = async (id: string) => {
    return prisma.user.findUnique({
        where: {id: id}
    })
}