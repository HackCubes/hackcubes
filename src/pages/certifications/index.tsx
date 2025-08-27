import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/certification',
      permanent: false,
    },
  };
};

export default function RedirectToCertification() {
  return null;
}
