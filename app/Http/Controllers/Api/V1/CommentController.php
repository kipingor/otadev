<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Comment;
use App\Http\Resources\CommentResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index()
    {
        return CommentResource::collection(
            Comment::with('user')->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'commentable_type' => 'required|string',
            'commentable_id' => 'required|integer',
            'body' => 'required|string',
        ]);

        $data['user_id'] = $request->user()->id;

        return new CommentResource(Comment::create($data));
    }

    public function show(Comment $comment)
    {
        return new CommentResource($comment->load('user'));
    }

    public function update(Request $request, Comment $comment)
    {
        $comment->update($request->only('body', 'metadata'));

        return new CommentResource($comment);
    }

    public function destroy(Comment $comment)
    {
        $comment->delete();

        return response()->noContent();
    }
}
