"use client";
import mock from './mock';
import './chat/Chatdata';
import './blog/blogData';
import './contacts/ContactsData';
import './notes/NotesData';
import './ticket/TicketData';
import './eCommerce/ProductsData';
import './email/EmailData';
import './userprofile/PostData';
import './userprofile/UsersData';
import './notes/NotesData'
import './kanban/KanbanData';
import './invoice/invoceLists';
mock.onAny().passThrough();
