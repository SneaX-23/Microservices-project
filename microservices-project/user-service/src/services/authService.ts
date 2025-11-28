import {prisma} from "../db/prisma"

export const createUser = async (email: string, password: string, username: string) =>{
    return prisma.user.create({
        data: {email, password, username}
    })
};

export const findUser = async (email: string) => {
    return prisma.user.findUnique({
        where: {email}
    })
}

export const findUserByEmailOrUsername = async (email?: string, username?: string) => {
    return prisma.user.findFirst({
        where: {
            OR: [
                {email: email},
                {username: username}
            ]
        }
    });
};

export const storeRefreshToken = async (id: string, hashedRefreshToken: string) => {
    return prisma.refreshToken.create({
        data: {
            userId: id,
            hashedToken: hashedRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
    }
)};

export const findTokenByHash = async (hT: string) => {
    return await prisma.refreshToken.findFirst({
      where: { hashedToken: hT }
    });
};

export const revokeAllUserTokens = async (id: string) => {
    return prisma.refreshToken.deleteMany({
        where: {
            userId: id
        }
    });
}

export const deleteToken = async (id: string) => {
    return prisma.refreshToken.delete({
        where: {
            id: id
        }
    });
};

export const rotateRefreshToken = async (
    userId: string, 
    oldTokenId: string, 
    newHashedToken: string
) => {
    return await prisma.$transaction(async (tx) => {
        // A. Create the new token record
        const newToken = await tx.refreshToken.create({
            data: {
                userId: userId,
                hashedToken: newHashedToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
            }
        });

        // Update the old token to point to the new one
        await tx.refreshToken.update({
            where: { id: oldTokenId },
            data: { replacedBy: newToken.id }
        });

        return newToken;
    });
}; 