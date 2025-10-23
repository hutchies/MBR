import PocketBase from 'pocketbase';

const PB_URL = 'https://hutchies.pockethost.io/'; // 'http://127.0.0.1:8090';
const PB_USER = 'test@gmail.com'; // Soon make this individual by username
const PB_PWD = 'test';

export let pb;
let pb_auth_data; 

let dbName = 'mbr';

pb = new PocketBase(PB_URL);

export async function auth(){
    await PBLogin(await getUsername());
    return {};
   
}

function getUsername(){
    return 'user';
}

export async function login(user, pwd){
    if(pb.authStore && pb.authStore.isValid) pb.authStore.clear();
    await pb.collection('_superusers').authWithPassword(user, pwd);
}

export function amAdmin(){
    return pb.authStore && pb.authStore.record && pb.authStore.record.id == adminID;
}


export async function PBLogin(username){
    if(pb.authStore && pb.authStore.record && pb.authStore.record.email == `${username}@${dbName}.com`) return;
    //if(pb.authStore && pb.authStore.isValid) pb.authStore.clear();
    if(pb.authStore && pb.authStore.isValid) pb.authStore.clear();
    try{
        let d = await pb.collection('users').authWithPassword(`${username}@${dbName}.com`, '12345678');
        console.log('login attempt:', d, pb.authStore);
    }catch(e){
        console.log('Error logging in:', e)
        // Presume this is that it needs creating
        await login(PB_USER, PB_PWD);
        try{
            await pb.collection('users').create({
                email: `${username}@${dbName}.com`,
                password: '12345678',
                passwordConfirm: '12345678'
            });
            if(pb.authStore && pb.authStore.isValid) pb.authStore.clear();
            let d = await pb.collection('users').authWithPassword(`${username}@${dbName}.com`, '12345678');
            console.log('login attempt:', d, pb.authStore);
        }catch(e){
            //alert('Unable to create user: '+e.message);
            console.log('Unable to create user:', e)
        }
    }
    if(pb.authStore && pb.authStore.record && pb.authStore.record.email != `${username}@stcc.com`){
        console.log("Failed auth login!", pb.authStore);
    };
    if(pb.authStore && pb.authStore.isValid) return true;
}