import Image from 'next/image';

export function SocialProof() {
  const companies = [
    {
      name: 'Labbe Logística',
      logo: '/logos/labbe-logistics.png',
      description: 'Empresa de transporte',
      result: '52% → 100% en 3 meses'
    },
    {
      name: 'Goldcorp Chile',
      logo: '/logos/goldcorp-chile.png',
      description: 'Minería',
      result: '180+ obligaciones mapeadas'
    }
  ];

  return (
    <section className="py-16 bg-muted/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Empresas que confían en KUMPLIO
          </h2>
          <p className="text-muted-foreground text-lg">
            Casos reales de empresas chilenas cumpliendo normativas con nuestro sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {companies.map((company, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-lg p-8 flex flex-col items-center text-center hover:shadow-lg hover:border-primary/50 transition"
            >
              <div className="h-24 w-full mb-6 relative flex items-center justify-center bg-muted/50 rounded">
                <Image
                  src={company.logo}
                  alt={company.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-contain p-4"
                />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">{company.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
              <div className="mt-auto pt-4 border-t border-border w-full">
                <p className="text-sm font-semibold text-primary">{company.result}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Más de 50 empresas chilenas están mejorando su compliance con KUMPLIO
          </p>
        </div>
      </div>
    </section>
  );
}
