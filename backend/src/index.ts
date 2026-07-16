type Group = {
    groupId: string;
    groupName: string;
    createdByDisplayName: string;
    createdAt: string;
};

const group: Group = {
    groupId: "group-001",
    groupName: "休日にやりたいこと",
    createdByDisplayName: "こり",
    createdAt: new Date().toISOString(),
};

console.log(group);