import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { assignGroups, listGroups, listUsers, toggleDisabled } from "./actions";
import { checkAdmin, tokenBelongsToProjectOwner } from "./checkAdmin";

export const authActions = functions.https.onCall(async (params: {
    action: string,
    uids: string[],
    groups: { [group: string]: boolean },
    filter?: {
        group?: string,
        q?: string,
    }
}, context) => {
    await checkAdmin(context.auth?.token);
    const actions: { [action: string]: () => Promise<unknown> } = {
        async disable() {
            return await toggleDisabled(params.uids, true, context.auth?.uid);
        },
        async enable() {
            return await toggleDisabled(params.uids, false);
        },
        async listUsers() {
            return listUsers({ q: params.filter?.q, group: params.filter?.group });
        },
        async listGroups() {
            return listGroups();
        },
        async assignGroups() {
            return await assignGroups(params.uids, params.groups, context.auth?.uid)
        },
        async delete() {
            const withoutCaller = params.uids.filter(it => it !== context.auth?.uid);
            await admin.auth().deleteUsers(withoutCaller)
        },
        async isProjectOwner() {
            return await tokenBelongsToProjectOwner(context.auth?.token)
        }
    }
    return await actions[params.action]?.();
})
