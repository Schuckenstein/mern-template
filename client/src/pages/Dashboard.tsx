// client/src/pages/Dashboard.tsx

import React, { useEffect } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Button,
  Avatar,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiUpload, FiUsers, FiFileText, FiActivity } from 'react-icons/fi'

import { useAuth } from '@/hooks/useAuth'
import { useFileStore } from '@/stores/fileStore'
import { formatDate } from '@/utils/validation'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { files, getFiles } = useFileStore()
  const navigate = useNavigate()

  const cardBg = useColorModeValue('white', 'gray.800')
  const statBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    getFiles()
  }, [getFiles])

  const stats = [
    {
      label: 'Total Files',
      value: files.length,
      change: '+12%',
      changeType: 'increase' as const,
      icon: FiFileText,
      color: 'blue'
    },
    {
      label: 'Storage Used',
      value: '2.4 GB',
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: FiUpload,
      color: 'green'
    },
    {
      label: 'Active Sessions',
      value: '1',
      change: 'current',
      changeType: undefined,
      icon: FiActivity,
      color: 'purple'
    },
    {
      label: 'Profile Views',
      value: '47',
      change: '+8.1%',
      changeType: 'increase' as const,
      icon: FiUsers,
      color: 'orange'
    }
  ]

  const recentFiles = files.slice(0, 5)

  return (
    <>
      <Helmet>
        <title>Dashboard - MERN Template</title>
        <meta name="description" content="Your dashboard overview" />
      </Helmet>

      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <VStack align="start" spacing={1}>
                <Heading size="lg">
                  Welcome back, {user?.firstName || user?.email}!
                </Heading>
                <Text color="gray.600">
                  Here's what's happening with your account today.
                </Text>
              </VStack>
              <Avatar
                size="lg"
                src={user?.avatar}
                name={`${user?.firstName} ${user?.lastName}`}
              />
            </HStack>
          </Box>

          {/* Stats Grid */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            {stats.map((stat, index) => (
              <GridItem key={index}>
                <Card bg={cardBg}>
                  <CardBody>
                    <Stat>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1}>
                          <StatLabel color="gray.600" fontSize="sm">
                            {stat.label}
                          </StatLabel>
                          <StatNumber fontSize="2xl" fontWeight="bold">
                            {stat.value}
                          </StatNumber>
                          {stat.changeType && (
                            <StatHelpText mb={0}>
                              <StatArrow type={stat.changeType} />
                              {stat.change}
                            </StatHelpText>
                          )}
                        </VStack>
                        <Box p={3} bg={statBg} borderRadius="lg">
                          <stat.icon size={20} />
                        </Box>
                      </HStack>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>

          {/* Content Grid */}
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
            {/* Recent Files */}
            <GridItem>
              <Card bg={cardBg}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Recent Files</Heading>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/files')}>
                      View all
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="stretch">
                    {recentFiles.length > 0 ? (
                      recentFiles.map((file) => (
                        <HStack key={file.id} justify="space-between" p={3} bg={statBg} borderRadius="md">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium" fontSize="sm">
                              {file.originalName}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(file.createdAt)}
                            </Text>
                          </VStack>
                          <Badge colorScheme="blue" variant="subtle">
                            {file.mimeType.split('/')[0]}
                          </Badge>
                        </HStack>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        No files uploaded yet
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>

            {/* Quick Actions */}
            <GridItem>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">Quick Actions</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="stretch">
                    <Button
                      leftIcon={<FiUpload />}
                      variant="outline"
                      onClick={() => navigate('/files')}
                    >
                      Upload Files
                    </Button>
                    <Button
                      leftIcon={<FiUsers />}
                      variant="outline"
                      onClick={() => navigate('/profile')}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      leftIcon={<FiActivity />}
                      variant="outline"
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Account Status */}
              <Card bg={cardBg} mt={6}>
                <CardHeader>
                  <Heading size="md">Account Status</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Email Verified</Text>
                      <Badge colorScheme={user?.isEmailVerified ? 'green' : 'red'}>
                        {user?.isEmailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Account Type</Text>
                      <Badge colorScheme="purple">
                        {user?.role}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Member Since</Text>
                      <Text fontSize="sm" color="gray.600">
                        {user?.createdAt && formatDate(user.createdAt)}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </>
  )
}

export default DashboardPage