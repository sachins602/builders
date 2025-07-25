export default function About() {
  return (
    <section id="about" className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-black text-center">
        About <em>Our Missing Middle</em>
      </h1>
      <p className="flex justify-center">
        <img src="/images/newlogo.png" alt="Housing Forms" className="mb-4 rounded-full shadow-lg h-[40vh]" />
      </p>
      <p>
        <strong>Our Missing Middle</strong> is a proof-of-concept web application designed to help visualize and explore <em>medium density housing</em> options in low-rise neighborhoods using AI-powered image manipulation.
      </p>

      <p>
        This tool is intended for municipal governments to deploy and for community members to use. When deployed, it can be customized to match the design language and planning context of individual municipalities, integrating with their APIs to reflect local zoning, architectural guidelines, and community needs.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Purpose
      </h2>
      <p>
        Our goal is to make it easier to imagine and share alternative housing forms; <em>Our Missing Middle</em> supports more inclusive, community-driven conversations about urban density and design. This app is <em>not the solution</em> to the affordable housing crisis—but it is <em>part of the solution</em>.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        What is Missing Middle Housing?
      </h2>
      <p className="flex justify-center">
        <img src="/images/housingforms.png" alt="Housing Forms" className="mb-4 rounded-lg shadow-lg h-[40vh]" />
      </p>
      <p>
        Missing middle housing refers to a range of multi-unit or clustered housing types that are compatible in scale with single-family homes. These include duplexes, triplexes, fourplexes, townhouses, and small apartment buildings. They provide a middle ground between single-family homes and larger apartment complexes, offering more affordable and diverse housing options.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Tackling NIMBYism
      </h2>
      <p className="flex justify-center">
        <img src="/images/uglyvsattractive.png" alt="Housing Forms" className="mb-4 rounded-lg shadow-lg h-[40vh]" />
      </p>
      <p>
        One of the biggest challenges in implementing medium density housing is overcoming NIMBYism (Not In My Backyard). This app aims to address this by allowing users to visualize how these housing types would look in their neighborhoods, helping to alleviate concerns and foster acceptance.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Getting Started
      </h2>
      <ol className="list-decimal list-inside ">
        <li>Log in using your Google Account</li>
        <li>Select a parcel on the map home screen</li>
        <li>Choose whether to generate a build off of the existing house or continue from another user&#39;s work</li>
        <li>Use the AI chat to generate a design to your liking</li>
        <li>Share the image with the community and your own social networks!</li>
      </ol>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Connecting With Others
      </h2>
      <p>
        We have a rudimentary community organization feature for users to connect with each other outside of this app. This app is activist in nature - take these ideas, share them, and work together to foster change in your local community.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Technology Stack
      </h2>
      <ul>
        <li><strong>AI Integration:</strong> OpenAI (gpt-image-1) </li>
        <li><strong>Frontend:</strong> React, TailwindCSS, ShadCN UI</li>
        <li><strong>Backend:</strong> NextJS, Vercel</li>
        <li><strong>Database:</strong> Azure MySQL</li>
        <li><strong>Package Management:</strong> pnpm</li>
        <li><strong>Mapping & Imagery:</strong> Google Street View, MapTiler with OpenStreetMap</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-black">
        Created By
      </h2>
      <p>
        This project was developed by Thomas McCavour, Sachin Sapkota, and Harkirat Bhullar (Team BT) as part of our Capstone Project at Conestoga College.
      </p>
    </section>
  );
}
