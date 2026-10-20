// صفحة قديمة من نظام السوق — Savana3D صار متجر بائع واحد
export async function getServerSideProps() {
  return { redirect: { destination: "/store", permanent: false } };
}

export default function Retired() {
  return null;
}
