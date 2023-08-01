import {$query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal} from "azle";
import { v4 as uuidv4 } from "uuid";
  
type Post = Record<{
    id: string;
    owner: Principal;
    content: string;
    likes: number;
    liked: Vec<string>;
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
  // returns an error message if post with id isn't found
  $query;
  export function getPost(id: string): Result<Post, string> {
    return match(postStorage.get(id), {
      Some: (post) => Result.Ok<Post, string>(post),
      None: () => Result.Err<Post, string>(`Post with id=${id} not found`),
    });
  }
  
  // Function to fetch all posts
  $query;
  export function getAllPosts(): Result<Vec<Post>, string> {
    return Result.Ok(postStorage.values());
  }
  
  // Function that allows users to create a post
  $update;
  export function createPost(payload: PostPayload): Result<Post, string> {
    const post: Post = {
      id: uuidv4(),
      owner: ic.caller(),
      content: payload.content,
      likes: 0,
      liked: [],
      comments: [],
      createdAt: ic.time(),
      updatedAt: Opt.None,
    };
    postStorage.insert(post.id, post);
    return Result.Ok(post);
  }
  
  // Function that allows users to delete their own posts
  $update;
  export function deletePost(id: string): Result<Post, string> {
    return match(postStorage.get(id), {
      Some: (post) => {
        // if caller isn't the post's owner, return an error
        if (post.owner.toString() !== ic.caller().toString()) {
          return Result.Err<Post, string>("You are not the post's owner");
        }
        postStorage.remove(id);
        return Result.Ok<Post, string>(post);
      },
      None: () => Result.Err<Post, string>(`Post with id=${id} not found`),
    });
  }
  
  // Function that allows users to comment on a post
  $update;
  export function addComment(
    postId: string,
    payload: CommentPayload
  ): Result<Post, string> {
    return match(postStorage.get(postId), {
      Some: (post) => {
        const comment: Comment = {
          id: uuidv4(),
          owner: ic.caller(),
          content: payload.content,
          createdAt: ic.time(),
        };
        const updatedPost: Post = {
          ...post,
          comments: [...post.comments, comment],
        };
        postStorage.insert(post.id, updatedPost);
        return Result.Ok<Post, string>(updatedPost);
      },
      None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
    });
  }
  
  // Function that allows users to like a post
  $update;
  export function addLike(postId: string): Result<Post, string> {
    return match(postStorage.get(postId), {
      Some: (post) => {
        let liked: Vec<string> = post.liked;
        // checks if caller has already liked the post
        if (liked.includes(ic.caller().toString())) {
          return Result.Err<Post, string>(
            `Already liked post with id ${postId}`
          );
        }
        // add caller to the liked array and increment the likes property by 1
        const updatedPost: Post = {
          ...post,
          likes: post.likes + 1,
          liked: [...liked, ic.caller().toString()],
        };
        postStorage.insert(post.id, updatedPost);
        return Result.Ok<Post, string>(updatedPost);
      },
      None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
    });
  }
  
  // Function that allows users to unlike a post
  $update;
  export function removeLike(postId: string): Result<Post, string> {
    return match(postStorage.get(postId), {
      Some: (post) => {
        if (post.likes > 0) {
          let liked: Vec<string> = post.liked;
          const likedIndex = liked.findIndex((user) => ic.caller().toString() === user.toString());
          // checks if caller hasn't liked the post
          if (likedIndex === -1) {
            return Result.Err<Post, string>(
              `You haven't liked the post with id ${postId}`
            );
          }
          // removes caller from the liked array
          liked.splice(likedIndex, 1)
          // update the liked array and decrement the likes property by 1
          const updatedPost: Post = { ...post, likes: post.likes - 1 , liked: liked};
          postStorage.insert(post.id, updatedPost);
          return Result.Ok<Post, string>(updatedPost);
        } else {
          return Result.Err<Post, string>(
            `Post with id=${postId} has no likes to remove.`
          );
        }
      },
      None: () => Result.Err<Post, string>(`Post with id=${postId} not found`),
    });
  }
  
  // Function that allows users to follow another user
  $update;
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
  $update;
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
$query;
export function getFollowers(userId: Principal): Result<Vec<Principal>, string> {
  // Implement the logic to fetch the list of followers for the given user.

  // For demonstration purposes, returning an empty list of followers
  return Result.Ok<Vec<Principal>, string>(new Vec<Principal>());
}
  
// Function that allows users to get the list of users they are following
$query;
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
  