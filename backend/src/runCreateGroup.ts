import {createGroup} from './createGroup';

try {
    const result = createGroup({
        groupName: "休日にやりたいこと",
        createdByDisplayName: "こり",
    });

    console.log("DBに保存する情報");
    console.log(result.group);

    console.log("¥n利用者へ返すアクセストークン");
    console.log(result.accessToken);
} catch (error) {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("予期しないエラーが発生しました");
    }
}