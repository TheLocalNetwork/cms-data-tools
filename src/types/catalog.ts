/**
 * @description https://resources.data.gov/resources/dcat-us/
 *
 */

import {
  type TDataGovISODate,
  type TDataGovISODuration,
  type TDataGovMimeType,
  type TDataGovTemporal,
  type TDataGovURI,
  type TDataGovURIorJSON,
  type TDataGovUUID,
  type UnknownObject,
} from './util';

export interface IDataGovCatalog {
  /** @description URL or JSON object for the JSON-LD Context that defines the schema used. */
  [`@context`]?: TDataGovURIorJSON;

  /** @description IRI for the JSON-LD Node Identifier of the Catalog. This should be the URL of the data.json file itself. */
  [`@id`]?: TDataGovURI;

  /** @description IRI for the JSON-LD data type. This should be dcat:Catalog for the Catalog. */
  [`@type`]?: `dcat:Catalog`;

  /** @description URI that identifies the version of the Project Open Data schema being used. */
  conformsTo: TDataGovURI;

  /** @description URL for the JSON Schema file that defines the schema used. */
  describedBy?: TDataGovURI;

  /** @description A container for the array of Dataset objects. */
  dataset: IDataGovCatalogDataset[];
}

export interface IDataGovCatalogDataset {
  /** @description cms-data-tools enhancement */
  id: TDataGovUUID;

  /** @description IRI for the JSON-LD data type. This should be dcat:Dataset for each Dataset. */
  [`@type`]?: `dcat:Dataset`;

  /** @description Human-readable name of the asset. Should be in plain English and include sufficient detail to facilitate search and discovery. */
  title: string;

  /** @description Human-readable description (e.g., an abstract) with sufficient detail to enable a user to quickly understand whether the asset is of interest. */
  description: string;

  /** @description Tags (or keywords) help users discover your dataset; please include terms that would be used by technical and non-technical users. */
  keyword: string[];

  /** @description Most recent date on which the dataset was changed, updated or modified. */
  modified: TDataGovISODate;

  /** @description The publishing entity and optionally their parent organization(s). */
  publisher: IDataGovCatalogPublisher;

  /** @description Contact person’s name and email for the asset. */
  contactPoint: IDataGovCatalogContact;

  /** @description A unique identifier for the dataset or API as maintained within an Agency catalog or database. */
  identifier: string;

  /** @description The degree to which this dataset could be made publicly-available, regardless of whether it has been made available. Choices: public (Data asset is or could be made publicly available to all without restrictions), restricted public (Data asset is available under certain use restrictions), or non-public (Data asset is not available to members of the public). */
  accessLevel: string;

  /** @description Federal agencies, combined agency and bureau code from OMB Circular A-11, Appendix C (PDF, CSV in the format of 015:11. */
  bureauCode: string[];

  /** @description Federal agencies, list the primary program related to this data asset, from the Federal Program Inventory. Use the format of 015:001. */
  programCode: string[];

  /** @description The license or non-license (i.e. Public Domain) status with which the dataset or API has been published. See Open Licenses for more information. */
  license?: string;

  /** @description  	This may include information regarding access or restrictions based on privacy, security, or other policies. This should also serve as an explanation for the selected “accessLevel” including instructions for how to access a restricted file, if applicable, or explanation for why a “non-public” or “restricted public” data asset is not “public,” if applicable. Text, 255 characters. */
  rights?: string;

  /** @description The range of spatial applicability of a dataset. Could include a spatial region like a bounding box or a named place. */
  spatial?: string;

  /** @description The range of temporal applicability of a dataset (i.e., a start and end date of applicability for the data). */
  temporal?: TDataGovTemporal;

  /** @description  	A container for the array of Distribution objects. */
  distribution?: IDataGovCatalogDatasetDistribution[];

  /** @description The frequency with which dataset is published. */
  accrualPeriodicity?: TDataGovISODuration;

  /** @description URI used to identify a standardized specification the dataset conforms to. */
  conformsTo?: TDataGovURI;

  /**  @description Whether the dataset meets the agency’s Information Quality Guidelines (true/false). */
  dataQuality?: boolean;

  /**  @description The machine-readable file format (IANA Media Type also known as MIME Type) of the dataset’s Data Dictionary (describedBy). */
  describedByType?: TDataGovMimeType;

  /**  @description The collection of which the dataset is a subset. */
  isPartOf?: TDataGovURI;

  /** @description Date of formal issuance. */
  issued?: TDataGovISODate;

  /** @description The language of the dataset. */
  language?: string[];

  /** @description This field is not intended for an agency’s homepage (e.g. www.agency.gov), but rather if a dataset has a human-friendly hub or landing page that users can be directed to for all resources tied to the dataset. */
  landingPage?: TDataGovURI;

  /** @description For linking a dataset with an IT Unique Investment Identifier (UII). */
  primaryITInvestmentUII?: string;

  /** @description Related documents such as technical information about a dataset, developer documentation, etc. */
  references?: TDataGovURI[];

  /** @description If the system is designated as a system of records under the Privacy Act of 1974, provide the URL to the System of Records Notice related to this dataset. */
  systemOfRecords?: TDataGovURI;

  /** @description Main thematic category of the dataset. */
  theme?: string[];
}
export interface IDataGovCatalogDatasetDistribution {
  /** @description IRI for the JSON-LD data type. This should be dcat:Distribution for each Distribution. */
  [`@type`]?: `dcat:Distribution`;

  /** @description URL providing indirect access to a dataset, for example via API or a graphical interface. */
  accessURL?: TDataGovURI;

  /** @description URI used to identify a standardized specification the distribution conforms to. */
  conformsTo?: TDataGovURI;

  /** @description URL to the data dictionary for the distribution found at the downloadURL. Note that documentation other than a data dictionary can be referenced using Related Documents as shown in the expanded fields. */
  describedBy?: TDataGovURI;

  /** @description The machine-readable file format (IANA Media Type or MIME Type) of the distribution’s describedBy URL. */
  describedByType?: TDataGovMimeType;

  /** @description Human-readable description of the distribution. */
  description?: string;

  /** @description URL providing direct access to a downloadable file of a dataset. */
  downloadURL?: TDataGovURI;

  /** @description A human-readable description of the file format of a distribution. */
  format?: string;

  /** @description The machine-readable file format (IANA Media Type or MIME Type) of the distribution’s downloadURL. */
  mediaType?: TDataGovMimeType;

  /** @description Human-readable name of the distribution. */
  title?: string;
}

export interface IDataGovCatalogContact extends UnknownObject {
  '@type': 'vcard:Contact';
}

export interface IDataGovCatalogPublisher extends UnknownObject {
  '@type': 'org:Organization';
}
