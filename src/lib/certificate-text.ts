/** Modelo editável no cadastro da palestra e no certificado quando o campo está vazio. */
export const TEXTO_DECLARACAO_CERTIFICADO_PADRAO =
  'participou com aproveitamento do treinamento "{titulo}", realizado em {mesAno}, na data de {data}, com carga horária total de {cargaHoraria} hora(s).';

export type DeclaracaoPlaceholders = {
  nome: string;
  cpf: string;
  tituloPalestra: string;
  dataPalestra: string;
  mesAno: string;
  horario: string;
  cargaHoraria: number;
};

export function applyDeclaracaoPlaceholders(
  template: string,
  data: DeclaracaoPlaceholders
): string {
  return template
    .replace(/\{nome\}/gi, data.nome)
    .replace(/\{cpf\}/gi, data.cpf)
    .replace(/\{titulo\}/gi, data.tituloPalestra)
    .replace(/\{data\}/gi, data.dataPalestra)
    .replace(/\{mesAno\}/gi, data.mesAno)
    .replace(/\{horario\}/gi, data.horario)
    .replace(/\{cargaHoraria\}/gi, String(data.cargaHoraria))
    .replace(/\{carga\}/gi, String(data.cargaHoraria));
}
