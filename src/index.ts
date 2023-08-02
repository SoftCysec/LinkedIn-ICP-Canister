import { Record, StableBTreeMap, Vec, Result, nat64, ic, Opt, Principal } from "azle";
import { v4 as uuidv4 } from "uuid";

type Post = Record<{
  id: string;
  owner: Principal;
  content: string;
  liked: Vec<Principal>; // Change liked from a simple array of strings to a Vec of Principals
  comments: Vec<Comment>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type Comment = Record<{
  id: string;
  owner: Principal;
  content: string;
  createdAt: nat64;
}>;

type CommentPayload = Record<{
  content: string;
}>;

type PostPayload = Record<{
  content: string;
}>;

const postStorage = new StableBTreeMap<string, Post>(0, 44, 1024);

// Function to fetch a post
export function getPost(id: string): Result<Post, string> {
  const post = postStorage.get(id);
  if (!post) {
    return Result.Err<Post, string>(`Post with id=${id} not found`);
  }
  return Result.Ok<Post, string>(post);
}

// Function to fetch all posts
export function getAllPosts(): Result<Vec<Post>, string> {
  const posts = postStorage.values();
  return Result.Ok<Vec<Post>, string>(posts);
}

// Function that allows users to create a post
export function createPost(payload: PostPayload): Result<Post, string> {
  const post: Post = {
    id: uuidv4(),
    owner: ic.caller(),
    content: payload.content,
    liked: new Vec<Principal>(),
    comments: new Vec<Comment>(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
  };
  postStorage.insert(post.id, post);
  return Result.Ok<Post, string>(post);
}

// Function that allows users to delete their own posts
export function deletePost(id: string): Result<Post, string> {
  const post = postStorage.get(id);
  if (!post) {
    return Result.Err<Post, string>(`Post with id=${id} not found`);
  }

  if (post.owner.toString() !== ic.caller().toString()) {
    return Result.Err<Post, string>("You are not the post's owner");
  }

  postStorage.remove(id);
  return Result.Ok<Post, string>(post);
}

// Function that allows users to comment on a post
export function addComment(
  postId: string,
  payload: CommentPayload
): Result<Post, string> {
  const post = postStorage.get(postId);
  if (!post) {
    return Result.Err<Post, string>(`Post with id=${postId} not found`);
  }

  const comment: Comment = {
    id: uuidv4(),
    owner: ic.caller(),
    content: payload.content,
    createdAt: ic.time(),
  };

  post.comments.push(comment);
  postStorage.insert(post.id, post);
  return Result.Ok<Post, string>(post);
}

// Function that allows users to like a post
export function addLike(postId: string): Result<Post, string> {
  const post = postStorage.get(postId);
  if (!post) {
    return Result.Err<Post, string>(`Post with id=${postId} not found`);
  }

  const liked = post.liked;
  const caller = ic.caller().toString();

  if (liked.contains(caller)) {
    return Result.Err<Post, string>(`Already liked post with id ${postId}`);
  }

  liked.push(caller);
  postStorage.insert(post.id, post);
  return Result.Ok<Post, string>(post);
}

// Function that allows users to unlike a post
export function removeLike(postId: string): Result<Post, string> {
  const post = postStorage.get(postId);
  if (!post) {
    return Result.Err<Post, string>(`Post with id=${postId} not found`);
  }

  const liked = post.liked;
  const caller = ic.caller().toString();

  const likedIndex = liked.findIndex((user) => user.toString() === caller);
  if (likedIndex === -1) {
    return Result.Err<Post, string>(`You haven't liked the post with id ${postId}`);
  }

  liked.splice(likedIndex, 1);
  postStorage.insert(post.id, post);
  return Result.Ok<Post, string>(post);
}

// Function that allows users to follow another user
export function followUser(userId: Principal): Result<null, string> {
  const caller = ic.caller();
  if (caller.toString() === userId.toString()) {
    return Result.Err<null, string>("You cannot follow yourself.");
  }

  // Implement the logic to update the following list of the caller
  // and the followers list of the user being followed.

  return Result.Ok<null, string>(null);
}

// Function that allows users to unfollow another user
export function unfollowUser(userId: Principal): Result<null, string> {
  const caller = ic.caller();
  if (caller.toString() === userId.toString()) {
    return Result.Err<null, string>("You cannot unfollow yourself.");
  }

  // Implement the logic to update the following list of the caller
  // and the followers list of the user being unfollowed.

  return Result.Ok<null, string>(null);
}

// Function that allows users to get the list of followers for a user
export function getFollowers(userId: Principal): Result<Vec<Principal>, string> {
  // Implement the logic to fetch the list of followers for the given user.

  // For demonstration purposes, returning an empty list of followers
  return Result.Ok<Vec<Principal>, string>(new Vec<Principal>());
}

// Function that allows users to get the list of users they are following
export function getFollowing(): Result<Vec<Principal>, string> {
  // Implement the logic to fetch the list of users the caller is following.

  // For demonstration purposes, returning an empty list of following users
  return Result.Ok<Vec<Principal>, string>(new Vec<Principal>());
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
