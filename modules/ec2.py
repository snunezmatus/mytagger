import json
import boto3
from typing import List, Dict, Tuple
from botocore.exceptions import OperationNotPageableError

def discovery(self, session, account_id, region, service, service_type, logger):

    resource_configs = {
            'Instance': {
                'method': 'describe_instances',
                'key': 'Instances',
                'id_field': 'InstanceId',
                'date_field': 'LaunchTime',
                'nested': True,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:instance/{resource_id}'
            },
            'Volume': {
                'method': 'describe_volumes',
                'key': 'Volumes',
                'id_field': 'VolumeId',
                'date_field': 'CreateTime',
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:volume/{resource_id}'
            },
            'Snapshot': {
                'method': 'describe_snapshots',
                'key': 'Snapshots',
                'id_field': 'SnapshotId',
                'date_field': 'StartTime',
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:snapshot/{resource_id}'
            },
            'EIP': {
                'method': 'describe_addresses',
                'key': 'Addresses',
                'id_field': 'AllocationId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:eip-allocation/{resource_id}'
            },
            'Image': {
                'method': 'describe_images',
                'key': 'Images',
                'id_field': 'ImageId',
                'date_field': 'CreationDate',
                'nested': False,
                'owner_id': account_id,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:image/{resource_id}'
            },
            'InternetGateway': {
                'method': 'describe_internet_gateways',
                'key': 'InternetGateways',
                'id_field': 'InternetGatewayId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:internet-gateway/{resource_id}'
            },
            'NatGateway': {
                'method': 'describe_nat_gateways',
                'key': 'NatGateways',
                'id_field': 'NatGatewayId',
                'date_field': 'CreateTime',
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:nat-gateway/{resource_id}'
            },
            'VPNConnection': {
                'method': 'describe_vpn_connections',
                'key': 'VpnConnections',
                'id_field': 'VpnConnectionId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:vpn-connection/{resource_id}'
            },
            'SecurityGroup': {
                'method': 'describe_security_groups',
                'key': 'SecurityGroups',
                'id_field': 'GroupId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:security-group/{resource_id}'
            },
            'NetworkACL': {
                'method': 'describe_network_acls',
                'key': 'NetworkAcls',
                'id_field': 'NetworkAclId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:network-acl/{resource_id}'
            },
            'VPC': {
                'method': 'describe_vpcs',
                'key': 'Vpcs',
                'id_field': 'VpcId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:vpc/{resource_id}'
            },
            'Subnet': {
                'method': 'describe_subnets',
                'key': 'Subnets',
                'id_field': 'SubnetId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:subnet/{resource_id}'
            },
            'RouteTable': {
                'method': 'describe_route_tables',
                'key': 'RouteTables',
                'id_field': 'RouteTableId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:route-table/{resource_id}'
            },
            'VPNGateway': {
                'method': 'describe_vpn_gateways',
                'key': 'VpnGateways',
                'id_field': 'VpnGatewayId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:vpn-gateway/{resource_id}'
            },
            'CustomerGateway': {
                'method': 'describe_customer_gateways',
                'key': 'CustomerGateways',
                'id_field': 'CustomerGatewayId',
                'date_field': None,
                'nested': False,
                'arn_format': 'arn:aws:ec2:{region}:{account_id}:customer-gateway/{resource_id}'
            }
        }

    if service_type not in resource_configs:
            raise ValueError(f"Unsupported service type: {service_type}")

    return _discover_resources(session, account_id, region, service, service_type, resource_configs[service_type], logger)


def _discover_resources(session, account_id, region, service, service_type, config, logger):
    client = session.client(service, region_name=region)
    resources = []

    method = getattr(client, config['method'])
    params = {}

    if service_type == 'Snapshot':
        params['OwnerIds'] = [account_id]
    elif service_type == 'Image':
        params['Owners'] = [account_id]

    try:
        paginator = client.get_paginator(config['method'])
        response_iterator = paginator.paginate(**params)
    except OperationNotPageableError:
        # If the operation is not pageable, call the method directly
        response_iterator = [method(**params)]

    for page in response_iterator:
        if config['nested']:
            items = [instance for reservation in page['Reservations'] for instance in reservation['Instances']]
        else:
            items = page[config['key']]

        for item in items:
            resource_id = item[config['id_field']]
            resource_tags = {tag['Key']: tag['Value'] for tag in item.get('Tags', [])}
            name_tag = resource_tags.get('Name', '')

            creation_date = item.get(config['date_field']) if config['date_field'] else ''

            arn = config['arn_format'].format(
                    region=region,
                    account_id=account_id,
                    resource_id=resource_id
            )

            resources.append({
                    "seq": 0,
                    "account_id": account_id,
                    "region": region,
                    "service" : service,
                    "resource_type": service_type,
                    "resource_id": resource_id,
                    "name" : name_tag,
                    "creation_date": creation_date,
                    "tags": resource_tags,
                    "tags_number" : len(resource_tags),
                    "metadata" : item,
                    "arn" : arn
                })

    return resources



####----| Tagging method
def tagging(account_id, region, service, client, resources, tags_string, tags_action, logger):
    
    logger.info(f'Discovery # Account : {account_id}, Region : {region}, Service : {service}')
    
    results = []    
    tags = parse_tags(tags_string)

    if tags_action == 2:        
        tags = [{ 'Key' : item['Key'] } for item in tags]

    for resource in resources:            
        try:
            
            if tags_action == 1:               
                client.create_tags(
                    Resources=[resource.identifier],
                    Tags=tags
                )
            elif tags_action == 2:
                client.delete_tags(
                    Resources=[resource.identifier],
                    Tags=tags
                )                       
            results.append({
                'account_id': account_id,
                'region': region,
                'service': service,
                'identifier': resource.identifier,
                'status': 'success'
            })
            
        except Exception as e:
            logger.error(f"Error processing batch for {service} in {account_id}/{region}:{resource.identifier} # {str(e)}")
            
            results.append({
                'account_id': account_id,
                'region': region,
                'service': service,
                'identifier': resource.identifier,
                'status': 'error',
                'error': str(e)
            })    
    
    return results


####----| Parse method
def parse_tags(tags_string: str) -> List[Dict[str, str]]:
        tags = []
        for tag_pair in tags_string.split(','):
            key, value = tag_pair.split(':')
            tags.append({
                'Key': key.strip(),
                'Value': value.strip()
            })
        return tags
