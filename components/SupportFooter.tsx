export default function SupportFooter() {
  return (
    <>
      <p className="text-gray-500 text-center">
        Ce site est un jeu humoristique et absurde. Toute ressemblance avec une
        analyse politique serait purement fortuite : aucun jugement, aucune
        prise de position, aucun mouvement politique n&apos;est représenté ici.
      </p>
      <div className="flex items-center gap-4">
        <a href="https://www.buymeacoffee.com/m_platypus" target="_blank">
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png"
            alt="Buy Me A Coffee"
            height={40}
            width={147}
            style={{ height: "40px !important", width: "147px !important" }}
          />
        </a>
      </div>
    </>
  );
}
