// @ts-nocheck
import PocketBase from 'pocketbase';

const PB_URL = 'https://hutchies.cc/';

export const pb = new PocketBase(PB_URL);

// Editors live in mbr_users and are created server-side.
// Everything else is anonymous read-only.
export async function login(user, pwd){
    pb.authStore.clear();
    await pb.collection('mbr_users').authWithPassword(user, pwd);
}
