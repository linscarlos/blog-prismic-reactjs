import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


interface Post {
  first_publication_date: string | null;
  uid?: string;
  data: {
    title: string;
    subtitle?: string;
    banner?: {
      url: string;
    };
    author?: string;
    content?: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter();
  if (router.isFallback){
    return <span className={styles.loading}>Carregando...</span>
  }

  const wordsToMinutes = 200;
  const totalWords = Math.round(
    post.data.content.reduce(
      (acc, contentItem) => 
      acc +
      contentItem.heading.toString().split(' ').length +
      contentItem.body.reduce(
        (acc2, bodyItem) => acc2 + bodyItem.text.toString().split(' ').length,
        0
      ),
      0
    )
  );

  const totalMinutes = Math.ceil(totalWords / wordsToMinutes);

  return (
    <>
    <head>
      <title>{post.data.title} | Spacetraveling</title>
    </head>
    <Header />
    <main className={styles.container}>
    <div className={styles.bannerContainer}>
    <img 
    className={styles.banner}
    src={post.data.banner.url}
    alt="Banner"
    />
    </div>
    <article>
      <h1>{post.data.title}</h1>
      <div className={styles.info}>
        <div>
          <FiCalendar size={20} />
          <span>
            {format(new Date(post.first_publication_date),
            'dd MMM yyyy', {
              locale: ptBR,
            }
            )}
          </span>
        </div>
        <div>
          <FiUser size={20} />
          <span>{post.data.author}</span>
        </div>
        <div>
          <FiClock size={20} />
          <span>{totalMinutes} min</span>
        </div>
      </div>
      <div className={styles.content}>
        {post.data.content.map(contentItem => (
          <div 
          key={post.uid}
          className={styles.contentItem}
          >
            <h2>{contentItem.heading}</h2>
            <div
                className={styles.body}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(contentItem.body),
                }}
            />
            </div>
        ))}
      </div>
    </article>
    </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 100,
    }
  );

  return {
    paths: posts.results.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;
  
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {
      post: {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
          author: response.data.author,
          title: response.data.title,
          subtitle: response.data.subtitle,
          content: response.data.content,
          banner: {
            url: response.data.banner.url,
          },
        },
      },
    },
    revalidate: 60 * 30, // 30 minutes
  }
  
};
