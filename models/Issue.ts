import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface IAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface IComment {
  _id?: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: Date;
}

export interface IIssue extends Document {
  title: string;
  description: string;
  priority: Priority;
  status: IssueStatus;
  category: string;
  submittedBy: Types.ObjectId;
  submittedByName: string;
  submittedByDepartment: string;
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  dueDate?: Date;
  comments: IComment[];
  attachments: IAttachment[];
  statusHistory: { status: IssueStatus; changedBy: string; changedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const CommentSchema = new Schema<IComment>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
});

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    category: { type: String, required: true, trim: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedByName: { type: String, required: true },
    submittedByDepartment: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedToName: { type: String },
    dueDate: { type: Date },
    comments: [CommentSchema],
    attachments: [AttachmentSchema],
    statusHistory: [StatusHistorySchema],
  },
  { timestamps: true }
);

// Index for faster queries
IssueSchema.index({ status: 1, priority: 1, createdAt: -1 });
IssueSchema.index({ submittedBy: 1, createdAt: -1 });
IssueSchema.index({ assignedTo: 1, status: 1 });
IssueSchema.index({ dueDate: 1 });

const Issue: Model<IIssue> = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);
export default Issue;
