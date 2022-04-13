import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';
import Link from 'next/link';
import Header from '../components/Header';
import { useState } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { Document } from '@prismicio/client/types/documents';

import { FiCalendar, FiUser } from 'react-icons/fi'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const jsonResponse = (await response.json()) as ApiSearchResponse;

    const newPosts = jsonResponse.results.map((post: Document) => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setNextPage(jsonResponse.next_page);
  }

  return (
    <>
    <head>
      <title>Home | SpaceTravelling</title>
    </head>
    <Header />
    <main className={styles.container}>
      {posts.map(post => (
        <div className={styles.contentPost}>
        <Link href={`/post/${post.uid}`} key={post.uid}>
          <a className={styles.post}>
            <strong className={styles.title}>{post.data.title}</strong>
          <p>{post.data.subtitle}</p>
          <div className={styles.info}>
            <div>
              <FiCalendar size={20} />
              <span>
                {format(
                  new Date(post.first_publication_date),
                  'dd MMM yyyy',
                  {
                    locale: ptBR,
                  }
                )}
              </span>
            </div>
            <div>
              <FiUser size={20} />
              <span>{post.data.author}</span>
            </div>
          </div>
          </a>
        </Link>
        </div>
      ))}
      {nextPage && (
        <button 
        type="button" 
        className={styles.loadMorePosts}
        onClick={handleMorePosts} >
          Carregar mais posts
        </button>
      )}
    </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
});

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 30, // 30min
  }
}
