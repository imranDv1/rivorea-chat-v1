import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google";
import { fetchRedis } from "@/helpers/redis";
// Import the Upstash Redis adapter for NextAuth.js

function getGoogleCredentials() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Google credentials are not set in environment variables.");
    }

    return { clientId, clientSecret };
}

export const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login'
    },
    providers: [
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {

            const dbUserReult = await fetchRedis('get',`user:${token.id}`) as string | null

            if (!dbUserReult) {
                token.id = user!.id
                return token
            }

            const dbUser = JSON.parse(dbUserReult) as User
            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
                verified: dbUser.verified || false,
                goldenBadge: dbUser.goldenBadge || false
            }
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
                session.user.name = token.name
                session.user.email = token.email
                session.user.image = token.picture
            }

            return session;

        },

        redirect() {
            return '/dashboard'
        }
    }

}