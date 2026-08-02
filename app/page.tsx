import { HomeHero } from "@/components/home-hero";
import { HomePreview } from "@/components/home-preview";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-12 md:gap-20 md:pb-16">
      <HomeHero />
      <HomePreview />
    </div>
  );
}
