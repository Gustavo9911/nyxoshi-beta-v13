export type Profile = {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  image: string | null;
  bannerUrl: string | null;
  profileGifUrl: string | null;
  websiteUrl: string | null;
  permanentId: string;
  role: string;
  founderNumber: number | null;
  createdAt: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
  isBlocked: boolean;
  isSelf: boolean;
};

export type PostCard = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    userId: string;
    username: string;
    displayName: string;
    image: string | null;
    role?: string;
    founderNumber?: number | null;
  };
  quotedPost?: {
    id: string;
    body: string;
    createdAt: string;
    author: { userId: string; username: string; displayName: string; image: string | null; role?: string; founderNumber?: number | null };
  } | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  reactionCount: number;
  repostCount: number;
  quoteCount: number;
  bookmarkedByMe: boolean;
  repostedByMe: boolean;
};

export type CommentCard = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    userId: string;
    username: string;
    displayName: string;
    image: string | null;
  };
  parentId?: string | null;
  reactionCount: number;
  reactedByMe: boolean;
  replyCount: number;
};

export type NotificationCard = {
  id: string;
  type: "like" | "comment" | "follow" | "repost" | "quote" | "mention" | "reaction";
  createdAt: string;
  read: boolean;
  postId: string | null;
  actor: {
    userId: string;
    username: string;
    displayName: string;
    image: string | null;
  };
};

export type FeedTab = "forYou" | "following";


export type Conversation = {
  threadId: string;
  other: { userId: string; username: string; displayName: string; image: string | null };
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unread: number;
};

export type MessageItem = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  readAt: string | null;
  replyToId?: string | null;
  reactions?: {reaction:string;count:number;reactedByMe:boolean}[];
};

export type MessageRequest = {
  id: string;
  sender: { userId: string; username: string; displayName: string; image: string | null };
  body: string;
  status: string;
  createdAt: string;
};
