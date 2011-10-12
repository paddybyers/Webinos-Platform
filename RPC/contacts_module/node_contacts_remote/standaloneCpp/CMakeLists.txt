project(gCalContactsABTest) #a new feature descriptor
cmake_minimum_required(VERSION 2.8)

#if user does not set any build type, set default
IF(NOT CMAKE_BUILD_TYPE)
	set(CMAKE_BUILD_TYPE "RelWithDebInfo" CACHE STRING "..." FORCE)
ENDIF(NOT CMAKE_BUILD_TYPE)

#set some additional cmake modules we need
set(CMAKE_MODULE_PATH  ${PROJECT_SOURCE_DIR}/cmake-extensions/ )
find_package(PkgConfig)

#add libgcal and its dependencies
pkg_check_modules(LGCal REQUIRED libgcal)
IF("${LGCal_FOUND}" STREQUAL "1")
	message(STATUS "LGCal found: TRUE")
	message(STATUS "LGCal VERSION: ${LGCal_VERSION}")
	include_directories(${LGCal_INCLUDE_DIRS})
	link_directories(${LGCal_LIBRARY_DIRS})
ENDIF("${LGCal_FOUND}" STREQUAL "1")

#you may add other libraries here if needed
set(EXTERNAL_LIBS ${EXTERNAL_LIBS} ${LGCal_LIBRARIES})


set(GCONTACTS_SRC_DIR "../src" CACHE STRING "..." FORCE)
include_directories(${GCONTACTS_SRC_DIR})

#Compile and install gCalContactsAB library
set(GCONTACTS_LIB_SRC ${GCONTACTS_SRC_DIR}/gAddressBook.cpp)
set(GCONTACTS_LIB_NAME gCalContactsAB)
add_library(${GCONTACTS_LIB_NAME} SHARED ${GCONTACTS_LIB_SRC})
target_link_libraries(${GCONTACTS_LIB_NAME} ${EXTERNAL_LIBS})
install(TARGETS ${GCONTACTS_LIB_NAME} LIBRARY DESTINATION ${gCalContactsABTest_BINARY_DIR}/lib )

#Compile and install gCalContactsAB test program
include_directories(${PROJECT_SOURCE_DIR}/src)
link_directories(${PROJECT_BINARY_DIR}/src)
set(EXE_NAME test)
set(EXE_SRC main.cpp)
add_executable(${EXE_NAME} ${EXE_SRC})
set_target_properties(${EXE_NAME} PROPERTIES INSTALL_RPATH "${PROJECT_BINARY_DIR}/src")
target_link_libraries(${EXE_NAME} ${GCONTACTS_LIB_NAME})
install(TARGETS ${EXE_NAME} DESTINATION ${PROJECT_BINARY_DIR})
