import { pb, adminLogin } from "$lib/pb";

export const load = async ({params}) => {
    // auth
    let data = await pb.collection('borrowing').getFullList();
    return {
        data
    }
    // load from db
}